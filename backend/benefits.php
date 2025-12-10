<?php
/**
 * Employee Benefits API Endpoint
 * Handles benefit assignment, retrieval, update, and revocation
 */

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$benefitId = $_GET['id'] ?? null;

try {
    switch ($method) {
        case 'GET':
            if ($action === 'employee' && isset($_GET['employee_id'])) {
                // Get benefits for specific employee
                getEmployeeBenefits($_GET['employee_id']);
            } else {
                // Get all benefits
                getAllBenefits();
            }
            break;
            
        case 'POST':
            if ($action === 'assign') {
                // Assign benefits to employees
                assignBenefits();
            } else {
                // Create single benefit
                createBenefit();
            }
            break;
            
        case 'PUT':
            if ($action === 'revoke' && $benefitId) {
                // Revoke benefit
                revokeBenefit($benefitId);
            } elseif ($benefitId) {
                // Update benefit
                updateBenefit($benefitId);
            } else {
                sendResponse(['success' => false, 'message' => 'Benefit ID required'], 400);
            }
            break;
            
        case 'DELETE':
            if ($benefitId) {
                deleteBenefit($benefitId);
            } else {
                sendResponse(['success' => false, 'message' => 'Benefit ID required'], 400);
            }
            break;
            
        default:
            sendResponse(['success' => false, 'message' => 'Method not allowed'], 405);
    }
} catch (Exception $e) {
    error_log('Benefits API Error: ' . $e->getMessage());
    sendResponse([
        'success' => false,
        'message' => 'Server error',
        'error' => $e->getMessage()
    ], 500);
}

/**
 * Get all employee benefits with employee details
 */
function getAllBenefits() {
    global $pdo;
    
    $status = $_GET['status'] ?? null;
    $benefitType = $_GET['benefit_type'] ?? null;
    
    $query = "
        SELECT 
            eb.*,
            e.first_name,
            e.last_name,
            e.email,
            e.department,
            e.job_title,
            CONCAT(e.first_name, ' ', e.last_name) as employee_name
        FROM employee_benefits eb
        INNER JOIN employees e ON eb.employee_id = e.id
        WHERE 1=1
    ";
    
    $params = [];
    
    if ($status) {
        $query .= " AND eb.status = ?";
        $params[] = $status;
    }
    
    if ($benefitType) {
        $query .= " AND eb.benefit_type = ?";
        $params[] = $benefitType;
    }
    
    $query .= " ORDER BY eb.created_at DESC";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $benefits = $stmt->fetchAll();
    
    sendResponse($benefits);
}

/**
 * Get benefits for a specific employee
 */
function getEmployeeBenefits($employeeId) {
    global $pdo;
    
    if (!$employeeId) {
        sendResponse(['success' => false, 'message' => 'Employee ID required'], 400);
    }
    
    $stmt = $pdo->prepare("
        SELECT 
            eb.*,
            e.first_name,
            e.last_name,
            CONCAT(e.first_name, ' ', e.last_name) as employee_name
        FROM employee_benefits eb
        INNER JOIN employees e ON eb.employee_id = e.id
        WHERE eb.employee_id = ?
        ORDER BY eb.created_at DESC
    ");
    
    $stmt->execute([$employeeId]);
    $benefits = $stmt->fetchAll();
    
    sendResponse($benefits);
}

/**
 * Assign benefits to multiple employees
 */
function assignBenefits() {
    global $pdo;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    error_log('Assign Benefits Request: ' . json_encode($data));
    
    // Validate required fields
    $required = ['employee_ids', 'benefit_name', 'benefit_type', 'start_date'];
    foreach ($required as $field) {
        if (!isset($data[$field]) || (is_array($data[$field]) ? empty($data[$field]) : $data[$field] === '')) {
            sendResponse(['success' => false, 'message' => "$field is required"], 400);
        }
    }
    
    $employeeIds = $data['employee_ids'];
    if (!is_array($employeeIds)) {
        sendResponse(['success' => false, 'message' => 'employee_ids must be an array'], 400);
    }
    
    $benefitName = $data['benefit_name'];
    $benefitType = $data['benefit_type'];
    $description = $data['description'] ?? null;
    $value = isset($data['value']) ? floatval($data['value']) : null;
    $startDate = $data['start_date'];
    $endDate = $data['end_date'] ?? null;
    $notes = $data['notes'] ?? null;
    
    $createdBenefits = [];
    $errors = [];
    
    $pdo->beginTransaction();
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO employee_benefits (
                employee_id, benefit_name, benefit_type, description, 
                value, start_date, end_date, notes, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())
        ");
        
        foreach ($employeeIds as $employeeId) {
            try {
                $stmt->execute([
                    $employeeId,
                    $benefitName,
                    $benefitType,
                    $description,
                    $value,
                    $startDate,
                    $endDate,
                    $notes
                ]);
                
                $createdBenefits[] = [
                    'id' => $pdo->lastInsertId(),
                    'employee_id' => $employeeId,
                    'benefit_name' => $benefitName,
                    'status' => 'active'
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
            'message' => count($createdBenefits) . ' benefit(s) assigned successfully',
            'benefits' => $createdBenefits,
            'errors' => $errors
        ], 201);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

/**
 * Create a single benefit record
 */
function createBenefit() {
    global $pdo;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    $required = ['employee_id', 'benefit_name', 'benefit_type', 'start_date'];
    foreach ($required as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            sendResponse(['success' => false, 'message' => "$field is required"], 400);
        }
    }
    
    $stmt = $pdo->prepare("
        INSERT INTO employee_benefits (
            employee_id, benefit_name, benefit_type, description, 
            value, start_date, end_date, notes, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())
    ");
    
    $stmt->execute([
        $data['employee_id'],
        $data['benefit_name'],
        $data['benefit_type'],
        $data['description'] ?? null,
        isset($data['value']) ? floatval($data['value']) : null,
        $data['start_date'],
        $data['end_date'] ?? null,
        $data['notes'] ?? null
    ]);
    
    $benefitId = $pdo->lastInsertId();
    
    sendResponse([
        'success' => true,
        'message' => 'Benefit created successfully',
        'benefit' => [
            'id' => $benefitId,
            'employee_id' => $data['employee_id'],
            'benefit_name' => $data['benefit_name'],
            'status' => 'active'
        ]
    ], 201);
}

/**
 * Update a benefit record
 */
function updateBenefit($benefitId) {
    global $pdo;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Check if benefit exists
    $stmt = $pdo->prepare("SELECT id FROM employee_benefits WHERE id = ?");
    $stmt->execute([$benefitId]);
    if (!$stmt->fetch()) {
        sendResponse(['success' => false, 'message' => 'Benefit not found'], 404);
    }
    
    $updates = [];
    $params = [];
    
    $allowedFields = ['benefit_name', 'benefit_type', 'description', 'value', 'start_date', 'end_date', 'notes', 'status'];
    
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
    $params[] = $benefitId;
    
    $sql = "UPDATE employee_benefits SET " . implode(', ', $updates) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    sendResponse([
        'success' => true,
        'message' => 'Benefit updated successfully',
        'benefit' => ['id' => $benefitId]
    ]);
}

/**
 * Revoke a benefit (set status to inactive)
 */
function revokeBenefit($benefitId) {
    global $pdo;
    
    $stmt = $pdo->prepare("
        UPDATE employee_benefits 
        SET status = 'inactive', updated_at = NOW() 
        WHERE id = ?
    ");
    $stmt->execute([$benefitId]);
    
    if ($stmt->rowCount() === 0) {
        sendResponse(['success' => false, 'message' => 'Benefit not found'], 404);
    }
    
    sendResponse([
        'success' => true,
        'message' => 'Benefit revoked successfully',
        'benefit' => ['id' => $benefitId, 'status' => 'inactive']
    ]);
}

/**
 * Delete a benefit record permanently
 */
function deleteBenefit($benefitId) {
    global $pdo;
    
    $stmt = $pdo->prepare("DELETE FROM employee_benefits WHERE id = ?");
    $stmt->execute([$benefitId]);
    
    if ($stmt->rowCount() === 0) {
        sendResponse(['success' => false, 'message' => 'Benefit not found'], 404);
    }
    
    sendResponse([
        'success' => true,
        'message' => 'Benefit deleted successfully'
    ]);
}
