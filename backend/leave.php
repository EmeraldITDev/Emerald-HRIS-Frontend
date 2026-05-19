<?php
/**
 * Leave Request API Endpoint
 * Handles leave request creation, approval, rejection, and retrieval
 */

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$requestId = $_GET['id'] ?? null;

try {
    switch ($method) {
        case 'GET':
            if ($requestId) {
                // Get specific leave request
                getLeaveRequest($requestId);
            } elseif ($action === 'pending') {
                // Get pending leave requests (for approvers)
                getPendingLeaveRequests();
            } elseif ($action === 'user') {
                // Get leave requests for specific user
                $userId = $_GET['user_id'] ?? null;
                getUserLeaveRequests($userId);
            } else {
                // Get all leave requests
                getAllLeaveRequests();
            }
            break;
            
        case 'POST':
            if ($action === 'approve') {
                // Approve leave request
                approveLeaveRequest();
            } elseif ($action === 'reject') {
                // Reject leave request
                rejectLeaveRequest();
            } else {
                // Create new leave request
                createLeaveRequest();
            }
            break;
            
        case 'PUT':
            // Update leave request
            updateLeaveRequest($requestId);
            break;
            
        case 'DELETE':
            // Delete/cancel leave request
            deleteLeaveRequest($requestId);
            break;
            
        default:
            sendResponse(['success' => false, 'message' => 'Method not allowed'], 405);
    }
} catch (Exception $e) {
    sendResponse([
        'success' => false,
        'message' => 'Server error',
        'error' => $e->getMessage()
    ], 500);
}

/**
 * Get all leave requests with filters
 */
function getAllLeaveRequests() {
    global $pdo;
    
    $status = $_GET['status'] ?? null;
    $employeeId = $_GET['employee_id'] ?? null;
    
    $query = "
        SELECT 
            lr.*,
            e.first_name,
            e.last_name,
            e.email,
            e.department,
            CONCAT(e.first_name, ' ', e.last_name) as employee_name,
            approver.first_name as approver_first_name,
            approver.last_name as approver_last_name,
            CONCAT(approver.first_name, ' ', approver.last_name) as approver_name
        FROM leave_requests lr
        INNER JOIN employees e ON lr.employee_id = e.id
        LEFT JOIN employees approver ON lr.approved_by = approver.id
        WHERE 1=1
    ";
    
    $params = [];
    
    if ($status) {
        $query .= " AND lr.status = ?";
        $params[] = $status;
    }
    
    if ($employeeId) {
        $query .= " AND lr.employee_id = ?";
        $params[] = $employeeId;
    }
    
    $query .= " ORDER BY lr.created_at DESC";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $requests = $stmt->fetchAll();
    
    sendResponse([
        'success' => true,
        'data' => $requests,
        'count' => count($requests)
    ]);
}

/**
 * Get pending leave requests (for managers/HR)
 */
function getPendingLeaveRequests() {
    global $pdo;

    // Route by the `routed_to` column when present so each line manager only
    // sees requests assigned to them. HR/admin views ignore this filter by
    // passing ?action=pending&scope=all (handled separately upstream).
    $approverId = $_GET['approver_id'] ?? null;

    $query = "
        SELECT 
            lr.*,
            e.first_name,
            e.last_name,
            e.email,
            e.department,
            e.job_title,
            CONCAT(e.first_name, ' ', e.last_name) as employee_name,
            sup.id as routed_to_id,
            CONCAT(sup.first_name, ' ', sup.last_name) as routed_to_name,
            sup.email as routed_to_email
        FROM leave_requests lr
        INNER JOIN employees e ON lr.employee_id = e.id
        LEFT JOIN employees sup ON lr.routed_to = sup.id
        WHERE lr.status = 'pending'
    ";
    $params = [];
    if ($approverId) {
        $query .= " AND lr.routed_to = ?";
        $params[] = $approverId;
    }
    $query .= " ORDER BY lr.created_at ASC";

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $requests = $stmt->fetchAll();
    
    sendResponse([
        'success' => true,
        'data' => $requests,
        'count' => count($requests)
    ]);
}

/**
 * Get specific user's leave requests
 */
function getUserLeaveRequests($userId) {
    global $pdo;
    
    if (!$userId) {
        sendResponse(['success' => false, 'message' => 'User ID required'], 400);
    }
    
    $stmt = $pdo->prepare("
        SELECT 
            lr.*,
            approver.first_name as approver_first_name,
            approver.last_name as approver_last_name,
            CONCAT(approver.first_name, ' ', approver.last_name) as approver_name
        FROM leave_requests lr
        LEFT JOIN employees approver ON lr.approved_by = approver.id
        WHERE lr.employee_id = ?
        ORDER BY lr.created_at DESC
    ");
    
    $stmt->execute([$userId]);
    $requests = $stmt->fetchAll();
    
    sendResponse([
        'success' => true,
        'data' => $requests,
        'count' => count($requests)
    ]);
}

/**
 * Get specific leave request
 */
function getLeaveRequest($requestId) {
    global $pdo;
    
    if (!$requestId) {
        sendResponse(['success' => false, 'message' => 'Request ID required'], 400);
    }
    
    $stmt = $pdo->prepare("
        SELECT 
            lr.*,
            e.first_name,
            e.last_name,
            e.email,
            e.department,
            CONCAT(e.first_name, ' ', e.last_name) as employee_name,
            approver.first_name as approver_first_name,
            approver.last_name as approver_last_name,
            CONCAT(approver.first_name, ' ', approver.last_name) as approver_name
        FROM leave_requests lr
        INNER JOIN employees e ON lr.employee_id = e.id
        LEFT JOIN employees approver ON lr.approved_by = approver.id
        WHERE lr.id = ?
    ");
    
    $stmt->execute([$requestId]);
    $request = $stmt->fetch();
    
    if (!$request) {
        sendResponse(['success' => false, 'message' => 'Leave request not found'], 404);
    }
    
    sendResponse([
        'success' => true,
        'data' => $request
    ]);
}

/**
 * Resolve the supervisor employee id for a given employee using the
 * `supervisor_name` field on the employees table as the single source of
 * truth. Falls back to deriving the canonical company email
 * (firstname.lastname@emeraldcfze.com) when a name match fails.
 *
 * Returns the supervisor's employee id, or null if no supervisor can be
 * resolved (e.g. top-level executives). NEVER returns the submitting
 * employee's own id — that would route a request back to the requester.
 */
function resolveSupervisorId($employeeId) {
    global $pdo;

    $stmt = $pdo->prepare("SELECT id, first_name, last_name, supervisor_name FROM employees WHERE id = ?");
    $stmt->execute([$employeeId]);
    $emp = $stmt->fetch();
    if (!$emp) return null;

    $supName = trim((string)($emp['supervisor_name'] ?? ''));
    if ($supName === '') return null;

    // 1) Try exact match on CONCAT(first_name, ' ', last_name)
    $stmt = $pdo->prepare("
        SELECT id FROM employees
        WHERE LOWER(TRIM(CONCAT(first_name, ' ', last_name))) = LOWER(?)
        LIMIT 1
    ");
    $stmt->execute([$supName]);
    $row = $stmt->fetch();

    // 2) Fallback: derive canonical email firstname.lastname@emeraldcfze.com
    if (!$row) {
        $parts = preg_split('/\s+/', $supName);
        if (count($parts) >= 2) {
            $first = strtolower(preg_replace('/[^a-z]/i', '', $parts[0]));
            $last  = strtolower(preg_replace('/[^a-z]/i', '', end($parts)));
            if ($first && $last) {
                $derivedEmail = "$first.$last@emeraldcfze.com";
                $stmt = $pdo->prepare("SELECT id FROM employees WHERE LOWER(email) = ? LIMIT 1");
                $stmt->execute([$derivedEmail]);
                $row = $stmt->fetch();
            }
        }
    }

    if (!$row) return null;
    $supId = (int)$row['id'];

    // Hard guard: never route a request back to the submitter.
    if ($supId === (int)$employeeId) return null;

    return $supId;
}

/**
 * Create new leave request
 */
function createLeaveRequest() {
    global $pdo;

    $data = json_decode(file_get_contents('php://input'), true);

    $required = ['employee_id', 'leave_type', 'start_date', 'end_date', 'reason'];
    foreach ($required as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            sendResponse(['success' => false, 'message' => "$field is required"], 400);
        }
    }

    // Calculate number of days
    $startDate = new DateTime($data['start_date']);
    $endDate = new DateTime($data['end_date']);
    $interval = $startDate->diff($endDate);
    $days = $interval->days + 1;

    // Resolve first-level approver (line manager) from supervisor_name.
    $supervisorId = resolveSupervisorId($data['employee_id']);

    if ($supervisorId === null) {
        // No supervisor on file. For non-executive employees this is a data
        // integrity issue; reject so HR can correct the profile rather than
        // silently letting the request fall back to the requester.
        $stmt = $pdo->prepare("SELECT department FROM employees WHERE id = ?");
        $stmt->execute([$data['employee_id']]);
        $emp = $stmt->fetch();
        $dept = strtolower((string)($emp['department'] ?? ''));
        if ($dept !== 'executive') {
            sendResponse([
                'success' => false,
                'message' => 'No supervisor on file. Ask HR to set your Supervisor Name before submitting leave.'
            ], 422);
        }
    }

    $stmt = $pdo->prepare("
        INSERT INTO leave_requests (
            employee_id, leave_type, start_date, end_date,
            days, reason, status, routed_to, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, NOW())
    ");

    $stmt->execute([
        $data['employee_id'],
        $data['leave_type'],
        $data['start_date'],
        $data['end_date'],
        $days,
        $data['reason'],
        $supervisorId,
    ]);

    $requestId = $pdo->lastInsertId();

    sendResponse([
        'success' => true,
        'message' => 'Leave request submitted successfully',
        'data' => [
            'id' => $requestId,
            'status' => 'pending',
            'days' => $days,
            'routed_to' => $supervisorId,
        ]
    ], 201);
}

/**
 * Approve leave request
 */
function approveLeaveRequest() {
    global $pdo;
    
    $data = json_decode(file_get_contents('php://input'), true);
    $requestId = $data['request_id'] ?? null;
    $approverId = $data['approver_id'] ?? null;
    $comments = $data['comments'] ?? null;
    
    if (!$requestId || !$approverId) {
        sendResponse(['success' => false, 'message' => 'Request ID and Approver ID required'], 400);
    }
    
    // Check if request exists and is pending
    $stmt = $pdo->prepare("SELECT status FROM leave_requests WHERE id = ?");
    $stmt->execute([$requestId]);
    $request = $stmt->fetch();
    
    if (!$request) {
        sendResponse(['success' => false, 'message' => 'Leave request not found'], 404);
    }
    
    if ($request['status'] !== 'pending') {
        sendResponse(['success' => false, 'message' => 'Leave request already processed'], 400);
    }
    
    // Update request status
    $stmt = $pdo->prepare("
        UPDATE leave_requests 
        SET status = 'approved', 
            approved_by = ?,
            approved_at = NOW(),
            comments = ?
        WHERE id = ?
    ");
    
    $stmt->execute([$approverId, $comments, $requestId]);
    
    sendResponse([
        'success' => true,
        'message' => 'Leave request approved successfully',
        'data' => [
            'id' => $requestId,
            'status' => 'approved'
        ]
    ]);
}

/**
 * Reject leave request
 */
function rejectLeaveRequest() {
    global $pdo;
    
    $data = json_decode(file_get_contents('php://input'), true);
    $requestId = $data['request_id'] ?? null;
    $approverId = $data['approver_id'] ?? null;
    $comments = $data['comments'] ?? null;
    
    if (!$requestId || !$approverId) {
        sendResponse(['success' => false, 'message' => 'Request ID and Approver ID required'], 400);
    }
    
    // Check if request exists and is pending
    $stmt = $pdo->prepare("SELECT status FROM leave_requests WHERE id = ?");
    $stmt->execute([$requestId]);
    $request = $stmt->fetch();
    
    if (!$request) {
        sendResponse(['success' => false, 'message' => 'Leave request not found'], 404);
    }
    
    if ($request['status'] !== 'pending') {
        sendResponse(['success' => false, 'message' => 'Leave request already processed'], 400);
    }
    
    // Update request status
    $stmt = $pdo->prepare("
        UPDATE leave_requests 
        SET status = 'rejected', 
            approved_by = ?,
            approved_at = NOW(),
            comments = ?
        WHERE id = ?
    ");
    
    $stmt->execute([$approverId, $comments, $requestId]);
    
    sendResponse([
        'success' => true,
        'message' => 'Leave request rejected',
        'data' => [
            'id' => $requestId,
            'status' => 'rejected'
        ]
    ]);
}

/**
 * Delete/cancel leave request
 */
function deleteLeaveRequest($requestId) {
    global $pdo;
    
    if (!$requestId) {
        sendResponse(['success' => false, 'message' => 'Request ID required'], 400);
    }
    
    $stmt = $pdo->prepare("DELETE FROM leave_requests WHERE id = ?");
    $stmt->execute([$requestId]);
    
    if ($stmt->rowCount() === 0) {
        sendResponse(['success' => false, 'message' => 'Leave request not found'], 404);
    }
    
    sendResponse([
        'success' => true,
        'message' => 'Leave request deleted successfully'
    ]);
}
