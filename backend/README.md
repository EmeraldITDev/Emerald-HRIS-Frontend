# PHP Backend for HR Management System

This backend provides REST APIs for attendance tracking and leave request management.

## 📁 File Structure

```
backend/
├── config.php           # Database configuration and helper functions
├── attendance.php       # Attendance API endpoints
├── leave.php           # Leave request API endpoints
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
1. Copy the `backend` folder to your web server directory:
   - XAMPP: `C:\xampp\htdocs\backend\`
   - WAMP: `C:\wamp64\www\backend\`
   - MAMP: `/Applications/MAMP/htdocs/backend/`

2. Start Apache and MySQL services

3. Access via: `http://localhost/backend/attendance.php`

#### Option B: Using PHP Built-in Server (for testing)
```bash
cd backend
php -S localhost:8000
```
Access via: `http://localhost:8000/attendance.php`

### 4. Update Frontend API URLs

Update your frontend code to point to your PHP backend:

In `src/api.ts` or wherever you make API calls, change:
```typescript
const API_BASE_URL = 'http://localhost:8000'; // Or your server URL
```

## 📡 API Endpoints

### Attendance Endpoints

#### Get Today's Attendance (All Employees)
```
GET /attendance.php?action=today
```

#### Get User's Attendance Status
```
GET /attendance.php?action=user&user_id=1
```

#### Get All Attendance (with filters)
```
GET /attendance.php?start_date=2025-10-01&end_date=2025-10-08&employee_id=1
```

#### Clock In
```
POST /attendance.php?action=clockin
Content-Type: application/json

{
  "employee_id": 1
}
```

#### Clock Out
```
POST /attendance.php?action=clockout
Content-Type: application/json

{
  "employee_id": 1
}
```

### Leave Request Endpoints

#### Get All Leave Requests
```
GET /leave.php
```

#### Get Pending Leave Requests
```
GET /leave.php?action=pending
```

#### Get User's Leave Requests
```
GET /leave.php?action=user&user_id=1
```

#### Create Leave Request
```
POST /leave.php
Content-Type: application/json

{
  "employee_id": 1,
  "leave_type": "annual",
  "start_date": "2025-10-15",
  "end_date": "2025-10-17",
  "reason": "Family vacation"
}
```

#### Approve Leave Request
```
POST /leave.php?action=approve
Content-Type: application/json

{
  "request_id": 1,
  "approver_id": 5,
  "comments": "Approved"
}
```

#### Reject Leave Request
```
POST /leave.php?action=reject
Content-Type: application/json

{
  "request_id": 1,
  "approver_id": 5,
  "comments": "Insufficient leave balance"
}
```

## 🔒 Security Considerations

### IMPORTANT: Before Production

1. **Authentication**: The current `getAuthenticatedUserId()` function in `config.php` is a placeholder. Implement proper JWT token validation or session-based authentication.

2. **Role-Based Access Control**: Add checks to ensure only authorized users can:
   - Approve/reject leave requests (HR/Managers only)
   - View other employees' data
   - Perform administrative actions

3. **Input Validation**: Add more robust validation for:
   - Date ranges
   - Leave types
   - Employee IDs

4. **SQL Injection**: The code uses prepared statements, but always validate input.

5. **CORS**: Currently set to allow all origins (`*`). In production, restrict to your frontend domain:
```php
header('Access-Control-Allow-Origin: https://yourdomain.com');
```

6. **HTTPS**: Always use HTTPS in production.

## 🧪 Testing

### Using cURL

Test clock-in:
```bash
curl -X POST http://localhost:8000/attendance.php?action=clockin \
  -H "Content-Type: application/json" \
  -d '{"employee_id": 1}'
```

Test getting today's attendance:
```bash
curl http://localhost:8000/attendance.php?action=today
```

### Using Postman or Thunder Client
Import the endpoints and test with your preferred API testing tool.

## 🐛 Troubleshooting

### "Database connection failed"
- Check your database credentials in `config.php`
- Ensure MySQL service is running
- Verify database exists

### "CORS errors"
- Check that CORS headers are properly set in `config.php`
- Ensure your frontend is making requests to the correct URL

### "404 Not Found"
- Verify PHP files are in the correct directory
- Check your web server configuration
- Ensure `.php` extension is included in URLs

## 📝 Next Steps

1. Implement authentication system
2. Add role-based access control
3. Add email notifications for leave approvals
4. Add leave balance tracking
5. Add reporting and analytics
6. Deploy to production server

## 🔗 Integration with Your Existing Backend

If you already have a backend at `https://hris-backend-to3i.onrender.com`, you can:
1. Copy these endpoint implementations into your existing codebase
2. Ensure table schemas match
3. Update the base URL in your frontend
