// ── Attendance Schedule Config ──────────────────────────────────────────────
Route::get('attendance/schedule-config', [AttendanceController::class, 'scheduleConfig']);
Route::get('attendance/schedule-config/{location}/{day}', [AttendanceController::class, 'scheduleConfigForDay']);

// ── Employee Attendance Profile ──────────────────────────────────────────────
Route::get('employees/{id}/attendance-profile', [AttendanceController::class, 'employeeAttendanceProfile']);
Route::put('employees/{id}/attendance-profile', [AttendanceController::class, 'updateEmployeeAttendanceProfile']);

// ── Org-Wide Dashboard ──────────────────────────────────────────────────────
Route::get('attendance/org-dashboard', [AttendanceController::class, 'orgDashboard']);

// ── Exception Requests ──────────────────────────────────────────────────────
Route::post('exception-requests', [ExceptionRequestController::class, 'store']);
Route::get('exception-requests', [ExceptionRequestController::class, 'index']);
Route::post('exception-requests/{id}/manager-approve', [ExceptionRequestController::class, 'managerApprove']);
Route::post('exception-requests/{id}/manager-reject', [ExceptionRequestController::class, 'managerReject']);
Route::post('exception-requests/{id}/hr-approve', [ExceptionRequestController::class, 'hrApprove']);
Route::post('exception-requests/{id}/hr-reject', [ExceptionRequestController::class, 'hrReject']);

// ── WFH Requests ────────────────────────────────────────────────────────────
Route::post('wfh-requests', [WfhRequestController::class, 'store']);
Route::get('wfh-requests', [WfhRequestController::class, 'index']);
Route::post('wfh-requests/{id}/approve', [WfhRequestController::class, 'approve']);
Route::post('wfh-requests/{id}/reject', [WfhRequestController::class, 'reject']);

// ── Late Clock-In — Line Manager Tier (new) ─────────────────────────────────
Route::post('attendance/late-clockin-requests/{id}/manager-approve', [AttendanceController::class, 'managerApproveLateClockin']);
Route::post('attendance/late-clockin-requests/{id}/manager-reject', [AttendanceController::class, 'managerRejectLateClockin']);
