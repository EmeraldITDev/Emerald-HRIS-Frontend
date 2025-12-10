-- ================================================================
-- HR MANAGEMENT SYSTEM - DATABASE SCHEMA
-- ================================================================
-- Fill in your database name below and run this SQL file
-- USE your_database_name;

-- ================================================================
-- ATTENDANCE TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS `attendance` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` INT NOT NULL,
  `date` DATE NOT NULL,
  `clock_in` DATETIME NOT NULL,
  `clock_out` DATETIME DEFAULT NULL,
  `hours_worked` DECIMAL(5,2) DEFAULT NULL,
  `status` ENUM('present', 'absent', 'late', 'half_day') DEFAULT 'present',
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_employee_date (`employee_id`, `date`),
  INDEX idx_date (`date`),
  INDEX idx_status (`status`),
  
  UNIQUE KEY unique_employee_date (`employee_id`, `date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- LEAVE REQUESTS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS `leave_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` INT NOT NULL,
  `leave_type` VARCHAR(50) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `days` INT NOT NULL,
  `reason` TEXT NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
  `approved_by` INT DEFAULT NULL,
  `approved_at` DATETIME DEFAULT NULL,
  `comments` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_employee (`employee_id`),
  INDEX idx_status (`status`),
  INDEX idx_dates (`start_date`, `end_date`),
  INDEX idx_approved_by (`approved_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- EMPLOYEE BENEFITS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS `employee_benefits` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` INT NOT NULL,
  `benefit_name` VARCHAR(255) NOT NULL,
  `benefit_type` VARCHAR(100) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `value` DECIMAL(15,2) DEFAULT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `status` ENUM('active', 'inactive', 'pending') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_employee (`employee_id`),
  INDEX idx_status (`status`),
  INDEX idx_benefit_type (`benefit_type`),
  INDEX idx_dates (`start_date`, `end_date`),
  
  FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- TRAININGS TABLE (Training Programs)
-- ================================================================
CREATE TABLE IF NOT EXISTS `trainings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `instructor` VARCHAR(255) DEFAULT NULL,
  `location` VARCHAR(255) DEFAULT NULL,
  `delivery_method` ENUM('online', 'in_person', 'hybrid') DEFAULT 'online',
  `attachment_name` VARCHAR(255) DEFAULT NULL,
  `attachment_path` VARCHAR(500) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_category (`category`),
  INDEX idx_delivery_method (`delivery_method`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- TRAINING ASSIGNMENTS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS `training_assignments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `training_id` INT DEFAULT NULL,
  `employee_id` INT NOT NULL,
  `scheduled_at` DATETIME NOT NULL,
  `completion_deadline` DATETIME NOT NULL,
  `duration_hours` INT DEFAULT 1,
  `status` ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
  `completed_at` DATETIME DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `notification_read` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_employee (`employee_id`),
  INDEX idx_training (`training_id`),
  INDEX idx_status (`status`),
  INDEX idx_scheduled (`scheduled_at`),
  
  FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`training_id`) REFERENCES `trainings`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- USEFUL QUERIES
-- ================================================================

-- Get active benefits for an employee
-- SELECT * FROM employee_benefits WHERE employee_id = 1 AND status = 'active';

-- Get upcoming training assignments
-- SELECT ta.*, t.title, e.first_name, e.last_name 
-- FROM training_assignments ta
-- JOIN trainings t ON ta.training_id = t.id
-- JOIN employees e ON ta.employee_id = e.id
-- WHERE ta.status = 'scheduled' AND ta.scheduled_at >= NOW();

-- Get benefit summary by type
-- SELECT benefit_type, COUNT(*) as count, SUM(value) as total_value
-- FROM employee_benefits WHERE status = 'active' GROUP BY benefit_type;
