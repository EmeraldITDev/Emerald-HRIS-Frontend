-- Sample Data for HR Platform
-- Insert sample data for testing and demonstration

-- Insert sample users
INSERT INTO users (email, password_hash, full_name, role) VALUES
('admin@company.com', '$2b$10$example_hash_1', 'John Administrator', 'Power User'),
('manager@company.com', '$2b$10$example_hash_2', 'Sarah Manager', 'Leadership'),
('employee@company.com', '$2b$10$example_hash_3', 'Mike Employee', 'Staff'),
('hr@company.com', '$2b$10$example_hash_4', 'Lisa HR Specialist', 'Leadership'),
('staff@company.com', '$2b$10$example_hash_5', 'David Staff', 'Staff');

-- Insert sample departments
INSERT INTO departments (name, description, budget) VALUES
('Human Resources', 'Manages employee relations, benefits, and policies', 500000.00),
('Engineering', 'Software development and technical operations', 2000000.00),
('Marketing', 'Brand promotion and customer acquisition', 750000.00),
('Sales', 'Revenue generation and client relationships', 1200000.00),
('Finance', 'Financial planning and accounting', 600000.00),
('Operations', 'Business operations and logistics', 800000.00);

-- Insert sample employees
INSERT INTO employees (employee_id, first_name, last_name, email, phone, position, department, hire_date, salary, employment_type, status) VALUES
('EMP001', 'John', 'Smith', 'john.smith@company.com', '+1-555-0101', 'Senior Software Engineer', 'Engineering', '2022-01-15', 95000.00, 'Full-time', 'Active'),
('EMP002', 'Sarah', 'Johnson', 'sarah.johnson@company.com', '+1-555-0102', 'Marketing Manager', 'Marketing', '2021-03-20', 85000.00, 'Full-time', 'Active'),
('EMP003', 'Mike', 'Davis', 'mike.davis@company.com', '+1-555-0103', 'Sales Representative', 'Sales', '2023-06-10', 65000.00, 'Full-time', 'Active'),
('EMP004', 'Lisa', 'Brown', 'lisa.brown@company.com', '+1-555-0104', 'HR Specialist', 'Human Resources', '2020-09-05', 70000.00, 'Full-time', 'On Leave'),
('EMP005', 'David', 'Wilson', 'david.wilson@company.com', '+1-555-0105', 'Financial Analyst', 'Finance', '2022-11-12', 72000.00, 'Full-time', 'Active'),
('EMP006', 'Emily', 'Taylor', 'emily.taylor@company.com', '+1-555-0106', 'UX Designer', 'Engineering', '2023-02-28', 78000.00, 'Full-time', 'Active'),
('EMP007', 'James', 'Anderson', 'james.anderson@company.com', '+1-555-0107', 'Operations Coordinator', 'Operations', '2021-08-14', 58000.00, 'Full-time', 'Active'),
('EMP008', 'Jennifer', 'Martinez', 'jennifer.martinez@company.com', '+1-555-0108', 'Content Marketing Specialist', 'Marketing', '2023-04-03', 62000.00, 'Full-time', 'Active'),
('EMP009', 'Robert', 'Garcia', 'robert.garcia@company.com', '+1-555-0109', 'DevOps Engineer', 'Engineering', '2022-07-18', 88000.00, 'Full-time', 'Active'),
('EMP010', 'Amanda', 'Lee', 'amanda.lee@company.com', '+1-555-0110', 'Sales Manager', 'Sales', '2020-12-01', 92000.00, 'Full-time', 'Active'),
('EMP011', 'Bunmi', 'Babajide', 'bunmi.babajide@emeraldcfze.com', '+234 801 234 5678', 'Chief Executive Officer', 'Executive', '2020-01-15', 20000000.00, 'Full-time', 'Active'),
('EMP012', 'Oluwapelumi', 'Adeyefa', 'oluwapelumi.adeyefa@emeraldcfze.com', '+234 802 345 6789', 'Corporate HR Manager', 'Human Resources', '2021-06-01', 5000000.00, 'Full-time', 'Active');

-- Insert sample attendance records (last 30 days)
INSERT INTO attendance (employee_id, date, check_in_time, check_out_time, total_hours, status) 
SELECT 
    e.id,
    CURRENT_DATE - (generate_series(1, 30) || ' days')::interval,
    '09:00:00'::time + (random() * interval '60 minutes'),
    '17:30:00'::time + (random() * interval '60 minutes'),
    8.0 + (random() * 2 - 1), -- 7-9 hours
    CASE 
        WHEN random() < 0.05 THEN 'Absent'
        WHEN random() < 0.15 THEN 'Late'
        ELSE 'Present'
    END
FROM employees e
WHERE e.status = 'Active';

-- Insert sample leave requests
INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days_requested, reason, status) VALUES
((SELECT id FROM employees WHERE employee_id = 'EMP001'), 'Vacation', '2024-03-15', '2024-03-22', 8, 'Family vacation', 'Approved'),
((SELECT id FROM employees WHERE employee_id = 'EMP002'), 'Sick', '2024-02-10', '2024-02-12', 3, 'Flu symptoms', 'Approved'),
((SELECT id FROM employees WHERE employee_id = 'EMP003'), 'Personal', '2024-04-05', '2024-04-05', 1, 'Personal appointment', 'Pending'),
((SELECT id FROM employees WHERE employee_id = 'EMP004'), 'Maternity', '2024-01-01', '2024-04-01', 90, 'Maternity leave', 'Approved'),
((SELECT id FROM employees WHERE employee_id = 'EMP005'), 'Vacation', '2024-05-20', '2024-05-24', 5, 'Spring break', 'Pending');

-- Insert sample training programs
INSERT INTO training_programs (title, description, duration_hours, instructor, max_participants, start_date, end_date, status) VALUES
('Leadership Development', 'Advanced leadership skills for managers', 40, 'Dr. Patricia Williams', 20, '2024-03-01', '2024-03-31', 'In Progress'),
('Cybersecurity Awareness', 'Essential cybersecurity practices for all employees', 8, 'Security Team', 100, '2024-02-15', '2024-02-15', 'Completed'),
('Project Management Fundamentals', 'Basic project management principles and tools', 24, 'John Project Manager', 30, '2024-04-10', '2024-04-12', 'Scheduled'),
('Software Engineering Best Practices', 'Code quality, testing, and deployment strategies', 32, 'Senior Dev Team', 25, '2024-05-01', '2024-05-03', 'Scheduled'),
('Customer Service Excellence', 'Improving customer interaction and satisfaction', 16, 'Customer Success Team', 40, '2024-03-20', '2024-03-21', 'Scheduled');

-- Insert sample job postings
INSERT INTO recruitment_jobs (title, department, location, employment_type, salary_min, salary_max, description, requirements, status, posted_date, closing_date) VALUES
('Senior Frontend Developer', 'Engineering', 'New York, NY', 'Full-time', 90000.00, 120000.00, 'Join our frontend team to build amazing user experiences', 'React, TypeScript, 5+ years experience', 'Open', '2024-02-01', '2024-03-01'),
('Marketing Coordinator', 'Marketing', 'Remote', 'Full-time', 55000.00, 70000.00, 'Support marketing campaigns and content creation', 'Marketing degree, 2+ years experience', 'Open', '2024-02-15', '2024-03-15'),
('Data Analyst', 'Finance', 'Chicago, IL', 'Full-time', 65000.00, 85000.00, 'Analyze financial data and create reports', 'SQL, Excel, Statistics background', 'On Hold', '2024-01-20', '2024-02-20'),
('DevOps Engineer', 'Engineering', 'San Francisco, CA', 'Full-time', 95000.00, 130000.00, 'Manage infrastructure and deployment pipelines', 'AWS, Docker, Kubernetes, 4+ years experience', 'Open', '2024-02-10', '2024-03-10');

-- Insert sample announcements
INSERT INTO announcements (title, content, priority, target_audience, is_published, published_at, created_by) VALUES
('Company Holiday Schedule', 'Please note the updated holiday schedule for 2024. Memorial Day will be observed on May 27th.', 'Medium', 'All', true, '2024-02-01 09:00:00+00', (SELECT id FROM users WHERE email = 'hr@company.com')),
('New Employee Parking Policy', 'Starting March 1st, all employees must register their vehicles with security for parking access.', 'High', 'All', true, '2024-02-15 08:00:00+00', (SELECT id FROM users WHERE email = 'admin@company.com')),
('Q1 Performance Reviews', 'Engineering team: Performance review meetings will be scheduled during the week of March 18-22.', 'Medium', 'Department', true, '2024-02-20 10:00:00+00', (SELECT id FROM users WHERE email = 'manager@company.com'));

-- Insert sample benefits
INSERT INTO benefits (name, description, benefit_type, provider, employee_contribution, employer_contribution) VALUES
('Health Insurance Premium', 'Comprehensive medical coverage', 'Health Insurance', 'BlueCross BlueShield', 150.00, 450.00),
('Dental Insurance', 'Dental coverage including cleanings and procedures', 'Dental', 'Delta Dental', 25.00, 75.00),
('Vision Insurance', 'Eye care and prescription coverage', 'Vision', 'VSP', 15.00, 35.00),
('401(k) Retirement Plan', 'Company-matched retirement savings', 'Retirement', 'Fidelity', 0.00, 0.00),
('Life Insurance', 'Basic life insurance coverage', 'Life Insurance', 'MetLife', 0.00, 45.00),
('Paid Time Off', 'Vacation and sick leave', 'PTO', 'Internal', 0.00, 0.00);

-- Insert sample payroll records
INSERT INTO payroll (employee_id, pay_period_start, pay_period_end, base_salary, overtime_hours, overtime_pay, bonuses, deductions, tax_deductions, net_pay, status) 
SELECT 
    e.id,
    '2024-01-01'::date,
    '2024-01-15'::date,
    e.salary / 24, -- Bi-weekly pay
    CASE WHEN random() < 0.3 THEN random() * 10 ELSE 0 END, -- Some overtime
    CASE WHEN random() < 0.3 THEN (e.salary / 2080) * 1.5 * (random() * 10) ELSE 0 END, -- Overtime pay
    CASE WHEN random() < 0.1 THEN 1000 ELSE 0 END, -- Occasional bonus
    150.00, -- Standard deductions
    (e.salary / 24) * 0.22, -- Approximate tax rate
    (e.salary / 24) * 0.78 - 150.00 -- Net pay after taxes and deductions
FROM employees e
WHERE e.status = 'Active';