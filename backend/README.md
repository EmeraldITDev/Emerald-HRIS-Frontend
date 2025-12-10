# PHP Backend for HR Management System

This backend provides REST APIs for the HRIS platform including attendance, leave, benefits, and training management.

## 📁 File Structure

```
backend/
├── config.php           # Database configuration and helper functions
├── attendance.php       # Attendance API endpoints
├── leave.php           # Leave request API endpoints
├── benefits.php        # Employee benefits API endpoints
├── training.php        # Training assignments API endpoints
├── database-schema.sql # Database table creation script
└── README.md           # This file
```

## 🚀 Setup Instructions

### 1. Database Setup

1. Create a new MySQL database:
```sql
CREATE DATABASE your_database_name;
```

2. Import the schema:
```bash
mysql -u your_username -p your_database_name < database-schema.sql
```

Or run the SQL file directly in phpMyAdmin or your preferred MySQL client.

### 2. Configuration

Edit `config.php` and fill in your database credentials:

```php
define('DB_HOST', 'localhost');           // Your database host
define('DB_NAME', 'your_database_name');  // Your database name
define('DB_USER', 'your_username');       // Your database username
define('DB_PASS', 'your_password');       // Your database password
```

### 3. Server Setup

#### Option A: Using XAMPP/WAMP/MAMP
1. Copy the `backend` folder to your web server directory
2. Start Apache and MySQL services
3. Access via: `http://localhost/backend/`

#### Option B: Using PHP Built-in Server
```bash
cd backend
php -S localhost:8000
```

## 📡 API Endpoints

### Attendance Endpoints (`attendance.php`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `?action=today` | Get today's attendance for all employees |
| GET | `?action=user&user_id=1` | Get specific user's attendance status |
| GET | `?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` | Get attendance with filters |
| POST | `?action=clockin` | Clock in employee |
| POST | `?action=clockout` | Clock out employee |

### Leave Request Endpoints (`leave.php`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all leave requests |
| GET | `?action=pending` | Get pending leave requests |
| GET | `?action=user&user_id=1` | Get user's leave requests |
| GET | `?id=1` | Get specific leave request |
| POST | `/` | Create new leave request |
| POST | `?action=approve` | Approve leave request |
| POST | `?action=reject` | Reject leave request |
| DELETE | `?id=1` | Delete leave request |

### Benefits Endpoints (`benefits.php`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all employee benefits |
| GET | `?action=employee&employee_id=1` | Get benefits for specific employee |
| POST | `?action=assign` | Assign benefits to multiple employees |
| POST | `/` | Create single benefit |
| PUT | `?id=1` | Update benefit |
| PUT | `?action=revoke&id=1` | Revoke benefit (set inactive) |
| DELETE | `?id=1` | Delete benefit permanently |

#### Assign Benefits Request Body:
```json
{
  "employee_ids": [1, 2, 3],
  "benefit_name": "Health Insurance",
  "benefit_type": "health",
  "description": "Comprehensive health coverage",
  "value": 50000,
  "start_date": "2025-01-01",
  "end_date": "2025-12-31",
  "notes": "Annual plan"
}
```

### Training Endpoints (`training.php`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` or `?action=assignments` | Get all training assignments |
| GET | `?action=trainings` | Get all training programs |
| GET | `?action=employee&employee_id=1` | Get trainings for employee |
| POST | `?action=assign` | Assign training to employees |
| POST | `?action=create` | Create new training program |
| PUT | `?action=complete&id=1` | Mark training as completed |
| PUT | `?action=cancel&id=1` | Cancel training assignment |
| PUT | `?action=read&id=1` | Mark notification as read |
| PUT | `?id=1` | Update training assignment |
| DELETE | `?id=1` | Delete training assignment |

#### Assign Training Request Body:
```json
{
  "employee_ids": [1, 2, 3],
  "title": "Leadership Training",
  "category": "Leadership Development",
  "description": "Management skills workshop",
  "instructor": "John Smith",
  "location": "Conference Room A",
  "delivery_method": "in_person",
  "scheduled_at": "2025-01-15T09:00:00",
  "completion_deadline": "2025-01-15T17:00:00",
  "duration_hours": 8
}
```

## 🗄️ Database Tables

### Required Tables
- `employees` - Main employee records (should already exist)
- `attendance` - Clock in/out records
- `leave_requests` - Leave applications
- `employee_benefits` - Assigned benefits
- `trainings` - Training programs
- `training_assignments` - Training-employee assignments

Run `database-schema.sql` to create all required tables.

## 🔒 Security Considerations

### Before Production:

1. **Authentication**: Implement proper JWT token validation in `config.php`
2. **CORS**: Restrict to your frontend domain:
```php
header('Access-Control-Allow-Origin: https://yourdomain.com');
```
3. **HTTPS**: Always use HTTPS in production
4. **Input Validation**: Add robust validation for all inputs
5. **Rate Limiting**: Implement rate limiting for API endpoints

## 🧪 Testing with cURL

### Test Benefits Assignment:
```bash
curl -X POST "http://localhost:8000/benefits.php?action=assign" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "employee_ids": [1, 2],
    "benefit_name": "Health Insurance",
    "benefit_type": "health",
    "start_date": "2025-01-01"
  }'
```

### Test Training Assignment:
```bash
curl -X POST "http://localhost:8000/training.php?action=assign" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "employee_ids": [1],
    "title": "Safety Training",
    "category": "Safety",
    "scheduled_at": "2025-01-20T09:00:00",
    "completion_deadline": "2025-01-20T17:00:00",
    "duration_hours": 4
  }'
```

## 🐛 Troubleshooting

### "Database connection failed"
- Check credentials in `config.php`
- Ensure MySQL is running
- Verify database exists

### "Table doesn't exist" errors
- Run `database-schema.sql` to create tables
- Ensure employees table exists first

### "500 Server Error"
- Check PHP error logs
- Verify all required tables exist
- Check for syntax errors in PHP files

## 🔗 Integration with Render Backend

Your backend is deployed at: `https://hris-backend-to3i.onrender.com`

To add these new endpoints:
1. Upload the new PHP files to your Render deployment
2. Run the database schema updates
3. Test each endpoint

## 📝 API Response Format

All endpoints return JSON responses:

**Success:**
```json
{
  "success": true,
  "message": "Operation completed",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (dev only)"
}
```
