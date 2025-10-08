<?php
/**
 * Attendance API Endpoint
 * Handles clock-in, clock-out, and attendance retrieval
 */

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    switch ($method) {
        case 'GET':
            if ($action === 'today') {
                // Get today's attendance for all employees
                getTodayAttendance();
            } elseif ($action === 'user') {
                // Get specific user's attendance status
                $userId = $_GET['user_id'] ?? null;
                getUserAttendance($userId);
            } else {
                // Get all attendance records with optional filters
                getAllAttendance();
            }
            break;
            
        case 'POST':
            if ($action === 'clockin') {
                // Clock in
                clockIn();
            } elseif ($action === 'clockout') {
                // Clock out
                clockOut();
            }
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
 * Get today's attendance for all employees
 */
function getTodayAttendance() {
    global $pdo;
    
    $today = date('Y-m-d');
    
    $stmt = $pdo->prepare("
        SELECT 
            a.id,
            a.employee_id,
            a.clock_in,
            a.clock_out,
            a.status,
            a.date,
            e.first_name,
            e.last_name,
            e.email,
            e.department,
            CONCAT(e.first_name, ' ', e.last_name) as employee_name
        FROM attendance a
        INNER JOIN employees e ON a.employee_id = e.id
        WHERE a.date = ?
        ORDER BY a.clock_in DESC
    ");
    
    $stmt->execute([$today]);
    $attendance = $stmt->fetchAll();
    
    sendResponse([
        'success' => true,
        'data' => $attendance,
        'count' => count($attendance)
    ]);
}

/**
 * Get specific user's attendance status
 */
function getUserAttendance($userId) {
    global $pdo;
    
    if (!$userId) {
        sendResponse(['success' => false, 'message' => 'User ID required'], 400);
    }
    
    $today = date('Y-m-d');
    
    $stmt = $pdo->prepare("
        SELECT 
            a.*,
            e.first_name,
            e.last_name,
            CONCAT(e.first_name, ' ', e.last_name) as employee_name
        FROM attendance a
        INNER JOIN employees e ON a.employee_id = e.id
        WHERE a.employee_id = ? AND a.date = ?
        LIMIT 1
    ");
    
    $stmt->execute([$userId, $today]);
    $attendance = $stmt->fetch();
    
    sendResponse([
        'success' => true,
        'data' => $attendance ?: null
    ]);
}

/**
 * Get all attendance records with filters
 */
function getAllAttendance() {
    global $pdo;
    
    $startDate = $_GET['start_date'] ?? date('Y-m-d', strtotime('-30 days'));
    $endDate = $_GET['end_date'] ?? date('Y-m-d');
    $employeeId = $_GET['employee_id'] ?? null;
    
    $query = "
        SELECT 
            a.*,
            e.first_name,
            e.last_name,
            e.email,
            e.department,
            CONCAT(e.first_name, ' ', e.last_name) as employee_name
        FROM attendance a
        INNER JOIN employees e ON a.employee_id = e.id
        WHERE a.date BETWEEN ? AND ?
    ";
    
    $params = [$startDate, $endDate];
    
    if ($employeeId) {
        $query .= " AND a.employee_id = ?";
        $params[] = $employeeId;
    }
    
    $query .= " ORDER BY a.date DESC, a.clock_in DESC";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $attendance = $stmt->fetchAll();
    
    sendResponse([
        'success' => true,
        'data' => $attendance,
        'count' => count($attendance)
    ]);
}

/**
 * Clock in employee
 */
function clockIn() {
    global $pdo;
    
    $data = json_decode(file_get_contents('php://input'), true);
    $employeeId = $data['employee_id'] ?? null;
    
    if (!$employeeId) {
        sendResponse(['success' => false, 'message' => 'Employee ID required'], 400);
    }
    
    $today = date('Y-m-d');
    $clockInTime = date('Y-m-d H:i:s');
    
    // Check if already clocked in today
    $stmt = $pdo->prepare("SELECT id FROM attendance WHERE employee_id = ? AND date = ?");
    $stmt->execute([$employeeId, $today]);
    
    if ($stmt->fetch()) {
        sendResponse(['success' => false, 'message' => 'Already clocked in today'], 400);
    }
    
    // Insert clock in record
    $stmt = $pdo->prepare("
        INSERT INTO attendance (employee_id, date, clock_in, status)
        VALUES (?, ?, ?, 'present')
    ");
    
    $stmt->execute([$employeeId, $today, $clockInTime]);
    
    sendResponse([
        'success' => true,
        'message' => 'Clocked in successfully',
        'data' => [
            'id' => $pdo->lastInsertId(),
            'employee_id' => $employeeId,
            'date' => $today,
            'clock_in' => $clockInTime,
            'status' => 'present'
        ]
    ]);
}

/**
 * Clock out employee
 */
function clockOut() {
    global $pdo;
    
    $data = json_decode(file_get_contents('php://input'), true);
    $employeeId = $data['employee_id'] ?? null;
    
    if (!$employeeId) {
        sendResponse(['success' => false, 'message' => 'Employee ID required'], 400);
    }
    
    $today = date('Y-m-d');
    $clockOutTime = date('Y-m-d H:i:s');
    
    // Find today's attendance record
    $stmt = $pdo->prepare("
        SELECT id, clock_in, clock_out 
        FROM attendance 
        WHERE employee_id = ? AND date = ?
    ");
    $stmt->execute([$employeeId, $today]);
    $record = $stmt->fetch();
    
    if (!$record) {
        sendResponse(['success' => false, 'message' => 'No clock-in record found for today'], 400);
    }
    
    if ($record['clock_out']) {
        sendResponse(['success' => false, 'message' => 'Already clocked out today'], 400);
    }
    
    // Update with clock out time and calculate hours
    $clockIn = new DateTime($record['clock_in']);
    $clockOut = new DateTime($clockOutTime);
    $interval = $clockIn->diff($clockOut);
    $hoursWorked = $interval->h + ($interval->i / 60);
    
    $stmt = $pdo->prepare("
        UPDATE attendance 
        SET clock_out = ?, hours_worked = ?
        WHERE id = ?
    ");
    
    $stmt->execute([$clockOutTime, $hoursWorked, $record['id']]);
    
    sendResponse([
        'success' => true,
        'message' => 'Clocked out successfully',
        'data' => [
            'id' => $record['id'],
            'clock_out' => $clockOutTime,
            'hours_worked' => round($hoursWorked, 2)
        ]
    ]);
}
