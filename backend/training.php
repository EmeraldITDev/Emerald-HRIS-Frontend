<?php
/**
 * Training Assignments API Endpoint
 * Handles training creation, assignment, and tracking
 */

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$assignmentId = $_GET['id'] ?? null;

try {
    switch ($method) {
        case 'GET':
            if ($action === 'assignments') {
                // Get all training assignments
                getTrainingAssignments();
            } elseif ($action === 'trainings') {
                // Get all training programs
                getTrainings();
            } elseif ($action === 'employee' && isset($_GET['employee_id'])) {
                // Get training for specific employee
                getEmployeeTrainings($_GET['employee_id']);
            } else {
                // Default to assignments
                getTrainingAssignments();
            }
            break;
            
        case 'POST':
            if ($action === 'assign') {
                // Assign training to employees
                assignTraining();
            } elseif ($action === 'create') {
                // Create new training program
                createTraining();
            } else {
                // Default to assign
                assignTraining();
            }
            break;
            
        case 'PUT':
            if ($action === 'complete' && $assignmentId) {
                // Mark training as completed
                completeTraining($assignmentId);
            } elseif ($action === 'cancel' && $assignmentId) {
                // Cancel training assignment
                cancelTraining($assignmentId);
            } elseif ($action === 'read' && $assignmentId) {
                // Mark notification as read
                markNotificationRead($assignmentId);
            } elseif ($assignmentId) {
                // Update training assignment
                updateTrainingAssignment($assignmentId);
            } else {
                sendResponse(['success' => false, 'message' => 'Assignment ID required'], 400);
            }
            break;
            
        case 'DELETE':
            if ($assignmentId) {
                deleteTrainingAssignment($assignmentId);
            } else {
                sendResponse(['success' => false, 'message' => 'Assignment ID required'], 400);
            }
            break;
            
        default:
            sendResponse(['success' => false, 'message' => 'Method not allowed'], 405);
    }
} catch (Exception $e) {
    error_log('Training API Error: ' . $e->getMessage());
    sendResponse([
        'success' => false,
        'message' => 'Server error',
        'error' => $e->getMessage()
    ], 500);
}

/**
 * Get all training assignments with details
 */
function getTrainingAssignments() {
    global $pdo;
    
    $status = $_GET['status'] ?? null;
    $employeeId = $_GET['employee_id'] ?? null;
    
    $query = "
        SELECT 
            ta.*,
            e.first_name,
            e.last_name,
            e.email,
            e.department,
            CONCAT(e.first_name, ' ', e.last_name) as employee_name,
            t.title as training_title,
            t.category,
            t.description as training_description,
            t.instructor,
            t.location,
            t.delivery_method,
            t.attachment_name,
            t.attachment_path
        FROM training_assignments ta
        INNER JOIN employees e ON ta.employee_id = e.id
        LEFT JOIN trainings t ON ta.training_id = t.id
        WHERE 1=1
    ";
    
    $params = [];
    
    if ($status) {
        $query .= " AND ta.status = ?";
        $params[] = $status;
    }
    
    if ($employeeId) {
        $query .= " AND ta.employee_id = ?";
        $params[] = $employeeId;
    }
    
    $query .= " ORDER BY ta.created_at DESC";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $assignments = $stmt->fetchAll();
    
    // Format response with nested employee and training objects
    $formattedAssignments = array_map(function($a) {
        return [
            'id' => $a['id'],
            'training_id' => $a['training_id'],
            'employee_id' => $a['employee_id'],
            'scheduled_at' => $a['scheduled_at'],
            'completion_deadline' => $a['completion_deadline'],
            'duration_hours' => $a['duration_hours'],
            'status' => $a['status'],
            'completed_at' => $a['completed_at'],
            'notes' => $a['notes'],
            'notification_read' => $a['notification_read'],
            'created_at' => $a['created_at'],
            'updated_at' => $a['updated_at'],
            'employee' => [
                'first_name' => $a['first_name'],
                'last_name' => $a['last_name'],
                'email' => $a['email'],
                'department' => $a['department']
            ],
            'training' => [
                'id' => $a['training_id'],
                'title' => $a['training_title'],
                'category' => $a['category'],
                'description' => $a['training_description'],
                'instructor' => $a['instructor'],
                'location' => $a['location'],
                'delivery_method' => $a['delivery_method'],
                'attachment_name' => $a['attachment_name'],
                'attachment_path' => $a['attachment_path']
            ]
        ];
    }, $assignments);
    
    sendResponse($formattedAssignments);
}

/**
 * Get all training programs
 */
function getTrainings() {
    global $pdo;
    
    $stmt = $pdo->prepare("
        SELECT * FROM trainings ORDER BY created_at DESC
    ");
    $stmt->execute();
    $trainings = $stmt->fetchAll();
    
    sendResponse($trainings);
}

/**
 * Get trainings for specific employee
 */
function getEmployeeTrainings($employeeId) {
    global $pdo;
    
    $stmt = $pdo->prepare("
        SELECT 
            ta.*,
            t.title,
            t.category,
            t.description,
            t.instructor,
            t.location,
            t.delivery_method
        FROM training_assignments ta
        LEFT JOIN trainings t ON ta.training_id = t.id
        WHERE ta.employee_id = ?
        ORDER BY ta.scheduled_at DESC
    ");
    
    $stmt->execute([$employeeId]);
    $assignments = $stmt->fetchAll();
    
    sendResponse($assignments);
}

/**
 * Assign training to employees
 */
function assignTraining() {
    global $pdo;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    error_log('Assign Training Request: ' . json_encode($data));
    
    // Validate required fields
    $required = ['employee_ids', 'scheduled_at', 'completion_deadline'];
    foreach ($required as $field) {
        if (!isset($data[$field]) || (is_array($data[$field]) ? empty($data[$field]) : $data[$field] === '')) {
            sendResponse(['success' => false, 'message' => "$field is required"], 400);
        }
    }
    
    $employeeIds = $data['employee_ids'];
    if (!is_array($employeeIds)) {
        sendResponse(['success' => false, 'message' => 'employee_ids must be an array'], 400);
    }
    
    $trainingId = $data['training_id'] ?? null;
    $durationHours = isset($data['duration_hours']) ? intval($data['duration_hours']) : 1;
    $scheduledAt = $data['scheduled_at'];
    $completionDeadline = $data['completion_deadline'];
    
    $pdo->beginTransaction();
    
    try {
        // If no training_id provided, create a new training program
        if (!$trainingId && !empty($data['title'])) {
            $stmt = $pdo->prepare("
                INSERT INTO trainings (
                    title, category, description, instructor, 
                    location, delivery_method, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");
            
            $stmt->execute([
                $data['title'] ?? 'Untitled Training',
                $data['category'] ?? null,
                $data['description'] ?? null,
                $data['instructor'] ?? null,
                $data['location'] ?? null,
                $data['delivery_method'] ?? 'online'
            ]);
            
            $trainingId = $pdo->lastInsertId();
        }
        
        // Create assignments for each employee
        $createdAssignments = [];
        $errors = [];
        
        $stmt = $pdo->prepare("
            INSERT INTO training_assignments (
                training_id, employee_id, scheduled_at, completion_deadline,
                duration_hours, status, notification_read, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, 'scheduled', 0, NOW(), NOW())
        ");
        
        foreach ($employeeIds as $employeeId) {
            try {
                $stmt->execute([
                    $trainingId,
                    $employeeId,
                    $scheduledAt,
                    $completionDeadline,
                    $durationHours
                ]);
                
                $createdAssignments[] = [
                    'id' => $pdo->lastInsertId(),
                    'training_id' => $trainingId,
                    'employee_id' => $employeeId,
                    'status' => 'scheduled'
                ];
            } catch (Exception $e) {
                $errors[] = [
                    'employee_id' => $employeeId,
                    'error' => $e->getMessage()
                ];
            }
        }
        
        $pdo->commit();
        
        sendResponse([
            'success' => true,
            'message' => count($createdAssignments) . ' training assignment(s) created',
            'training_id' => $trainingId,
            'assignments' => $createdAssignments,
            'errors' => $errors
        ], 201);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

/**
 * Create a new training program
 */
function createTraining() {
    global $pdo;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['title']) || empty($data['title'])) {
        sendResponse(['success' => false, 'message' => 'Title is required'], 400);
    }
    
    $stmt = $pdo->prepare("
        INSERT INTO trainings (
            title, category, description, instructor, 
            location, delivery_method, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");
    
    $stmt->execute([
        $data['title'],
        $data['category'] ?? null,
        $data['description'] ?? null,
        $data['instructor'] ?? null,
        $data['location'] ?? null,
        $data['delivery_method'] ?? 'online'
    ]);
    
    $trainingId = $pdo->lastInsertId();
    
    sendResponse([
        'success' => true,
        'message' => 'Training program created successfully',
        'training' => [
            'id' => $trainingId,
            'title' => $data['title']
        ]
    ], 201);
}

/**
 * Mark training assignment as completed
 */
function completeTraining($assignmentId) {
    global $pdo;
    
    $data = json_decode(file_get_contents('php://input'), true);
    $notes = $data['notes'] ?? null;
    
    $stmt = $pdo->prepare("
        UPDATE training_assignments 
        SET status = 'completed', 
            completed_at = NOW(),
            notes = COALESCE(?, notes),
            updated_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$notes, $assignmentId]);
    
    if ($stmt->rowCount() === 0) {
        sendResponse(['success' => false, 'message' => 'Training assignment not found'], 404);
    }
    
    // Fetch updated assignment
    $stmt = $pdo->prepare("SELECT * FROM training_assignments WHERE id = ?");
    $stmt->execute([$assignmentId]);
    $assignment = $stmt->fetch();
    
    sendResponse([
        'success' => true,
        'message' => 'Training marked as completed',
        'assignment' => $assignment
    ]);
}

/**
 * Cancel training assignment
 */
function cancelTraining($assignmentId) {
    global $pdo;
    
    $stmt = $pdo->prepare("
        UPDATE training_assignments 
        SET status = 'cancelled', updated_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$assignmentId]);
    
    if ($stmt->rowCount() === 0) {
        sendResponse(['success' => false, 'message' => 'Training assignment not found'], 404);
    }
    
    // Fetch updated assignment
    $stmt = $pdo->prepare("SELECT * FROM training_assignments WHERE id = ?");
    $stmt->execute([$assignmentId]);
    $assignment = $stmt->fetch();
    
    sendResponse([
        'success' => true,
        'message' => 'Training assignment cancelled',
        'assignment' => $assignment
    ]);
}

/**
 * Mark notification as read
 */
function markNotificationRead($assignmentId) {
    global $pdo;
    
    $stmt = $pdo->prepare("
        UPDATE training_assignments 
        SET notification_read = 1, updated_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$assignmentId]);
    
    sendResponse([
        'success' => true,
        'message' => 'Notification marked as read'
    ]);
}

/**
 * Update training assignment
 */
function updateTrainingAssignment($assignmentId) {
    global $pdo;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    $updates = [];
    $params = [];
    
    $allowedFields = ['scheduled_at', 'completion_deadline', 'duration_hours', 'status', 'notes'];
    
    foreach ($allowedFields as $field) {
        if (isset($data[$field])) {
            $updates[] = "$field = ?";
            $params[] = $data[$field];
        }
    }
    
    if (empty($updates)) {
        sendResponse(['success' => false, 'message' => 'No fields to update'], 400);
    }
    
    $updates[] = "updated_at = NOW()";
    $params[] = $assignmentId;
    
    $sql = "UPDATE training_assignments SET " . implode(', ', $updates) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    if ($stmt->rowCount() === 0) {
        sendResponse(['success' => false, 'message' => 'Training assignment not found'], 404);
    }
    
    sendResponse([
        'success' => true,
        'message' => 'Training assignment updated'
    ]);
}

/**
 * Delete training assignment
 */
function deleteTrainingAssignment($assignmentId) {
    global $pdo;
    
    $stmt = $pdo->prepare("DELETE FROM training_assignments WHERE id = ?");
    $stmt->execute([$assignmentId]);
    
    if ($stmt->rowCount() === 0) {
        sendResponse(['success' => false, 'message' => 'Training assignment not found'], 404);
    }
    
    sendResponse([
        'success' => true,
        'message' => 'Training assignment deleted'
    ]);
}
