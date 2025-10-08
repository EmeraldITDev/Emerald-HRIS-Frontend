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
    
    $stmt = $pdo->prepare("
        SELECT 
            lr.*,
            e.first_name,
            e.last_name,
            e.email,
            e.department,
            e.job_title,
            CONCAT(e.first_name, ' ', e.last_name) as employee_name
        FROM leave_requests lr
        INNER JOIN employees e ON lr.employee_id = e.id
        WHERE lr.status = 'pending'
        ORDER BY lr.created_at ASC
    ");
    
    $stmt->execute();
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
    
    $stmt = $pdo->prepare("
        INSERT INTO leave_requests (
            employee_id, leave_type, start_date, end_date, 
            days, reason, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())
    ");
    
    $stmt->execute([
        $data['employee_id'],
        $data['leave_type'],
        $data['start_date'],
        $data['end_date'],
        $days,
        $data['reason']
    ]);
    
    $requestId = $pdo->lastInsertId();
    
    sendResponse([
        'success' => true,
        'message' => 'Leave request submitted successfully',
        'data' => [
            'id' => $requestId,
            'status' => 'pending',
            'days' => $days
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
