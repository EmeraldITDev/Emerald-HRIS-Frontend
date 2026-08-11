<?php

/**
 * Attendance v2 routes.
 *
 * Merge the contents of this file into routes/api-routes.php inside the
 * authenticated group (auth:sanctum), keeping the existing attendance routes
 * in place. The `use` statements below belong at the top of that file.
 */

use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\ExceptionRequestController;
use App\Http\Controllers\WfhRequestController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {

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

    // -- Aliases expected by the frontend ---------------------------------------
    Route::get('attendance/today', [AttendanceController::class, 'todayStatus']);
    Route::post('attendance/break-start', [AttendanceController::class, 'lunchStart']);
    Route::post('attendance/break-end', [AttendanceController::class, 'lunchEnd']);

    // -- Missing Clock-Out Requests ---------------------------------------------
    Route::post('attendance/missing-clockout-request', [AttendanceController::class, 'submitMissingClockoutRequest']);
    Route::get('attendance/missing-clockout-requests', [AttendanceController::class, 'getMissingClockoutRequests']);
    Route::post('attendance/missing-clockout-requests/{id}/approve', [AttendanceController::class, 'approveMissingClockout']);
    Route::post('attendance/missing-clockout-requests/{id}/reject', [AttendanceController::class, 'rejectMissingClockout']);

});
