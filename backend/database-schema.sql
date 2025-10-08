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
  
  -- Indexes for performance
  INDEX idx_employee_date (`employee_id`, `date`),
  INDEX idx_date (`date`),
  INDEX idx_status (`status`),
  
  -- Foreign key constraint (uncomment if you have employees table)
  -- FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE,
  
  -- Ensure one record per employee per day
  UNIQUE KEY unique_employee_date (`employee_id`, `date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- LEAVE REQUESTS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS `leave_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` INT NOT NULL,
  `leave_type` VARCHAR(50) NOT NULL, -- e.g., 'annual', 'sick', 'casual', 'maternity', etc.
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `days` INT NOT NULL,
  `reason` TEXT NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
  `approved_by` INT DEFAULT NULL, -- Employee ID of approver
  `approved_at` DATETIME DEFAULT NULL,
  `comments` TEXT DEFAULT NULL, -- Approver's comments
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  INDEX idx_employee (`employee_id`),
  INDEX idx_status (`status`),
  INDEX idx_dates (`start_date`, `end_date`),
  INDEX idx_approved_by (`approved_by`)
  
  -- Foreign key constraints (uncomment if you have employees table)
  -- FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE,
  -- FOREIGN KEY (`approved_by`) REFERENCES `employees`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- SAMPLE DATA FOR TESTING (Optional)
-- ================================================================

-- Sample attendance records
-- INSERT INTO `attendance` (`employee_id`, `date`, `clock_in`, `clock_out`, `hours_worked`, `status`) VALUES
-- (1, '2025-10-08', '2025-10-08 09:00:00', '2025-10-08 17:30:00', 8.5, 'present'),
-- (2, '2025-10-08', '2025-10-08 09:15:00', NULL, NULL, 'present');

-- Sample leave requests
-- INSERT INTO `leave_requests` (`employee_id`, `leave_type`, `start_date`, `end_date`, `days`, `reason`, `status`) VALUES
-- (1, 'annual', '2025-10-15', '2025-10-17', 3, 'Family vacation', 'pending'),
-- (2, 'sick', '2025-10-09', '2025-10-09', 1, 'Medical appointment', 'approved');

-- ================================================================
-- USEFUL QUERIES
-- ================================================================

-- Get today's attendance
-- SELECT a.*, e.first_name, e.last_name 
-- FROM attendance a
-- JOIN employees e ON a.employee_id = e.id
-- WHERE a.date = CURDATE();

-- Get pending leave requests
-- SELECT lr.*, e.first_name, e.last_name 
-- FROM leave_requests lr
-- JOIN employees e ON lr.employee_id = e.id
-- WHERE lr.status = 'pending'
-- ORDER BY lr.created_at ASC;

-- Get employee attendance summary for current month
-- SELECT 
--     employee_id,
--     COUNT(*) as days_present,
--     SUM(hours_worked) as total_hours,
--     AVG(hours_worked) as avg_hours
-- FROM attendance
-- WHERE MONTH(date) = MONTH(CURDATE()) 
--   AND YEAR(date) = YEAR(CURDATE())
-- GROUP BY employee_id;
