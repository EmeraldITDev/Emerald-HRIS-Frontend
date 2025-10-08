<?php
/**
 * Database Configuration File
 * Fill in your actual database credentials below
 */

// Database connection settings
define('DB_HOST', 'localhost');           // Change to your database host (e.g., 'localhost' or '127.0.0.1')
define('DB_NAME', 'your_database_name');  // Change to your actual database name
define('DB_USER', 'your_username');       // Change to your database username
define('DB_PASS', 'your_password');       // Change to your database password
define('DB_CHARSET', 'utf8mb4');

// CORS headers for frontend access
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Create database connection
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET,
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed',
        'error' => $e->getMessage()
    ]);
    exit();
}

/**
 * Helper function to send JSON response
 */
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

/**
 * Helper function to get authenticated user ID
 * Modify this based on your authentication system
 */
function getAuthenticatedUserId() {
    // OPTION 1: Get from Authorization header (JWT token)
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        // Parse your JWT token here and extract user_id
        // This is a placeholder - implement your actual token validation
        $token = str_replace('Bearer ', '', $headers['Authorization']);
        // return decodeJWT($token)['user_id'];
    }
    
    // OPTION 2: Get from session
    if (isset($_SESSION['user_id'])) {
        return $_SESSION['user_id'];
    }
    
    // OPTION 3: Get from POST data (for testing - not recommended for production)
    if (isset($_POST['user_id'])) {
        return $_POST['user_id'];
    }
    
    return null;
}

/**
 * Helper function to get employee by email
 */
function getEmployeeByEmail($email) {
    global $pdo;
    $stmt = $pdo->prepare("SELECT * FROM employees WHERE email = ?");
    $stmt->execute([$email]);
    return $stmt->fetch();
}
