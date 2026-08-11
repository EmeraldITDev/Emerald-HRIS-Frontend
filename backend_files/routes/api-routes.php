<?php

/**
 * Fully merged api-routes.php
 *
 * This file combines the original application API routes with the Attendance v2
 * additions. Upload it to `routes/api-routes.php` on your Render server.
 *
 * Notes:
 * - The `ExceptionRequestController` and `WfhRequestController` are new — make
 *   sure those files are uploaded to `app/Http/Controllers/` first.
 * - The `AttendanceController` is the updated v2 version with methods like
 *   `scheduleConfig`, `employeeAttendanceProfile`, `orgDashboard`,
 *   `submitMissingClockoutRequest`, etc.
 * - If any controller names in your actual backend differ from what is assumed
 *   below, update the references before deploying.
 */

use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BenefitController;
use App\Http\Controllers\CelebrationController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\ExceptionRequestController;
use App\Http\Controllers\LeaveApprovalController;
use App\Http\Controllers\LeaveController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\PerformanceController;
use App\Http\Controllers\PolicyController;
use App\Http\Controllers\RecruitmentController;
use App\Http\Controllers\TrainingController;
use App\Http\Controllers\WfhRequestController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public routes
|--------------------------------------------------------------------------
*/

Route::post('auth/login', [AuthController::class, 'login']);
Route::post('auth/verify-otp', [AuthController::class, 'verifyOtp']);
Route::post('auth/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('auth/reset-password', [AuthController::class, 'resetPassword']);

Route::get('test', [AuthController::class, 'test']);

/*
|--------------------------------------------------------------------------
| Authenticated routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    // ── Auth / User ───────────────────────────────────────────────────────────
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/change-password', [AuthController::class, 'changePassword']);

    // ── Employees ─────────────────────────────────────────────────────────────
    Route::get('employees-full', [EmployeeController::class, 'index']);
    Route::post('employees-full', [EmployeeController::class, 'store']);
    Route::get('employees-full/my-profile', [EmployeeController::class, 'myProfile']);
    Route::get('employees-full/{id}', [EmployeeController::class, 'show']);
    Route::put('employees-full/{id}', [EmployeeController::class, 'update']);
    Route::delete('employees-full/{id}', [EmployeeController::class, 'destroy']);
    Route::post('employees-full/import-csv', [EmployeeController::class, 'importCsv']);
    Route::post('employees-full/import-gross-salary', [EmployeeController::class, 'importGrossSalary']);
    Route::get('former-employees', [EmployeeController::class, 'formerEmployees']);

    Route::get('employees/{id}/documents', [DocumentController::class, 'index']);
    Route::post('employees/{id}/documents', [DocumentController::class, 'store']);
    Route::get('employees/{id}/documents/{documentId}/download', [DocumentController::class, 'download']);
    Route::delete('employees/{id}/documents/{documentId}', [DocumentController::class, 'destroy']);

    // ── Attendance (original + v2) ────────────────────────────────────────────
    Route::get('attendance', [AttendanceController::class, 'index']);
    Route::post('attendance/clock-in', [AttendanceController::class, 'clockIn']);
    Route::post('attendance/clock-out', [AttendanceController::class, 'clockOut']);
    Route::get('attendance/today', [AttendanceController::class, 'todayStatus']);
    Route::post('attendance/break-start', [AttendanceController::class, 'lunchStart']);
    Route::post('attendance/break-end', [AttendanceController::class, 'lunchEnd']);
    Route::get('attendance/statistics', [AttendanceController::class, 'statistics']);
    Route::get('attendance/daily-summary', [AttendanceController::class, 'getDailySummary']);

    Route::post('attendance/early-clockout-request', [AttendanceController::class, 'submitEarlyClockoutRequest']);
    Route::get('attendance/early-clockout-requests', [AttendanceController::class, 'getEarlyClockoutRequests']);
    Route::post('attendance/early-clockout-requests/{id}/approve', [AttendanceController::class, 'approveEarlyClockout']);
    Route::post('attendance/early-clockout-requests/{id}/reject', [AttendanceController::class, 'rejectEarlyClockout']);

    Route::post('attendance/late-clockin-request', [AttendanceController::class, 'submitLateClockInRequest']);
    Route::get('attendance/late-clockin-requests', [AttendanceController::class, 'getLateClockinRequests']);
    Route::post('attendance/late-clockin-requests/{id}/approve', [AttendanceController::class, 'approveLateClockin']);
    Route::post('attendance/late-clockin-requests/{id}/reject', [AttendanceController::class, 'rejectLateClockin']);
    Route::post('attendance/late-clockin-requests/{id}/manager-approve', [AttendanceController::class, 'managerApproveLateClockin']);
    Route::post('attendance/late-clockin-requests/{id}/manager-reject', [AttendanceController::class, 'managerRejectLateClockin']);

    Route::post('attendance/missing-clockout-request', [AttendanceController::class, 'submitMissingClockoutRequest']);
    Route::get('attendance/missing-clockout-requests', [AttendanceController::class, 'getMissingClockoutRequests']);
    Route::post('attendance/missing-clockout-requests/{id}/approve', [AttendanceController::class, 'approveMissingClockout']);
    Route::post('attendance/missing-clockout-requests/{id}/reject', [AttendanceController::class, 'rejectMissingClockout']);

    // Attendance v2 additions
    Route::get('attendance/schedule-config', [AttendanceController::class, 'scheduleConfig']);
    Route::get('attendance/schedule-config/{location}/{day}', [AttendanceController::class, 'scheduleConfigForDay']);
    Route::get('employees/{id}/attendance-profile', [AttendanceController::class, 'employeeAttendanceProfile']);
    Route::put('employees/{id}/attendance-profile', [AttendanceController::class, 'updateEmployeeAttendanceProfile']);
    Route::get('attendance/org-dashboard', [AttendanceController::class, 'orgDashboard']);

    // ── Exception & WFH Requests (v2) ─────────────────────────────────────────
    Route::post('exception-requests', [ExceptionRequestController::class, 'store']);
    Route::get('exception-requests', [ExceptionRequestController::class, 'index']);
    Route::post('exception-requests/{id}/manager-approve', [ExceptionRequestController::class, 'managerApprove']);
    Route::post('exception-requests/{id}/manager-reject', [ExceptionRequestController::class, 'managerReject']);
    Route::post('exception-requests/{id}/hr-approve', [ExceptionRequestController::class, 'hrApprove']);
    Route::post('exception-requests/{id}/hr-reject', [ExceptionRequestController::class, 'hrReject']);

    Route::post('wfh-requests', [WfhRequestController::class, 'store']);
    Route::get('wfh-requests', [WfhRequestController::class, 'index']);
    Route::post('wfh-requests/{id}/approve', [WfhRequestController::class, 'approve']);
    Route::post('wfh-requests/{id}/reject', [WfhRequestController::class, 'reject']);

    // ── Leave ─────────────────────────────────────────────────────────────────
    Route::get('leave', [LeaveController::class, 'index']);
    Route::post('leave', [LeaveController::class, 'store']);
    Route::put('leave/{id}', [LeaveController::class, 'update']);
    Route::delete('leave/{id}', [LeaveController::class, 'destroy']);
    Route::get('leave/types', [LeaveController::class, 'types']);
    Route::post('leave/submit-self', [LeaveController::class, 'submitSelf']);
    Route::get('leave/submit-context', [LeaveController::class, 'submitContext']);
    Route::get('leave/balance', [LeaveController::class, 'balance']);
    Route::post('leave/{id}/cancel', [LeaveController::class, 'cancel']);

    Route::get('leave-approvals/pending-manager', [LeaveApprovalController::class, 'pendingManager']);
    Route::get('leave-approvals/pending-hr', [LeaveApprovalController::class, 'pendingHr']);
    Route::post('leave-approvals/{id}/manager-approve', [LeaveApprovalController::class, 'managerApprove']);
    Route::post('leave-approvals/{id}/manager-reject', [LeaveApprovalController::class, 'managerReject']);
    Route::post('leave-approvals/{id}/hr-approve', [LeaveApprovalController::class, 'hrApprove']);
    Route::post('leave-approvals/{id}/hr-reject', [LeaveApprovalController::class, 'hrReject']);

    // ── Payroll ───────────────────────────────────────────────────────────────
    Route::post('payroll/generate', [PayrollController::class, 'generate']);
    Route::post('payroll/bulk-generate', [PayrollController::class, 'bulkGenerate']);
    Route::post('payroll/batch-approve', [PayrollController::class, 'batchApprove']);
    Route::get('payroll/draft-periods', [PayrollController::class, 'draftPeriods']);
    Route::get('payroll/allowed-periods', [PayrollController::class, 'allowedPeriods']);
    Route::get('payroll', [PayrollController::class, 'index']);
    Route::get('payroll/{id}', [PayrollController::class, 'show']);
    Route::put('payroll/{id}', [PayrollController::class, 'update']);
    Route::delete('payroll/{id}', [PayrollController::class, 'destroy']);
    Route::post('payroll/{id}/approve', [PayrollController::class, 'approve']);
    Route::post('payroll/{id}/reject', [PayrollController::class, 'reject']);
    Route::post('payroll/{id}/mark-ready', [PayrollController::class, 'markReady']);
    Route::post('payroll/{id}/revert-to-draft', [PayrollController::class, 'revertToDraft']);
    Route::get('payroll/{id}/audit-log', [PayrollController::class, 'auditLog']);
    Route::get('payroll/{id}/variance', [PayrollController::class, 'variance']);
    Route::get('payroll/bulk-export/pdf', [PayrollController::class, 'exportBulkPdf']);
    Route::post('payroll/force-delete-period', [PayrollController::class, 'forceDeletePeriod']);

    // ── Analytics ────────────────────────────────────────────────────────────
    Route::get('analytics/headcount-trends', [AnalyticsController::class, 'headcountTrends']);
    Route::get('analytics/hiring-trends', [AnalyticsController::class, 'hiringTrends']);
    Route::get('analytics/attendance-metrics', [AnalyticsController::class, 'attendanceMetrics']);
    Route::get('analytics/employment-types', [AnalyticsController::class, 'employmentTypes']);
    Route::get('analytics/salary-trends', [AnalyticsController::class, 'salaryTrends']);
    Route::get('analytics/department-stats', [AnalyticsController::class, 'departmentStats']);
    Route::get('analytics/dashboard-stats', [AnalyticsController::class, 'dashboardStats']);
    Route::get('analytics/vacation-details', [AnalyticsController::class, 'vacationDetails']);
    Route::get('analytics/annual-gross-salary', [AnalyticsController::class, 'annualGrossSalary']);

    // ── Training ──────────────────────────────────────────────────────────────
    Route::get('training', [TrainingController::class, 'index']);
    Route::post('training', [TrainingController::class, 'store']);
    Route::get('training/{id}', [TrainingController::class, 'show']);
    Route::put('training/{id}', [TrainingController::class, 'update']);
    Route::delete('training/{id}', [TrainingController::class, 'destroy']);
    Route::get('training/assignments', [TrainingController::class, 'assignments']);
    Route::post('training/{id}/assign', [TrainingController::class, 'assign']);
    Route::post('training/{id}/complete', [TrainingController::class, 'markComplete']);

    // ── Benefits ──────────────────────────────────────────────────────────────
    Route::get('benefits', [BenefitController::class, 'index']);
    Route::post('benefits', [BenefitController::class, 'store']);
    Route::get('benefits/{id}', [BenefitController::class, 'show']);
    Route::put('benefits/{id}', [BenefitController::class, 'update']);
    Route::delete('benefits/{id}', [BenefitController::class, 'destroy']);
    Route::post('benefits/assign', [BenefitController::class, 'assign']);
    Route::get('benefits/employee/{employeeId}', [BenefitController::class, 'employeeBenefits']);

    // ── Recruitment ───────────────────────────────────────────────────────────
    Route::get('recruitment/job-postings', [RecruitmentController::class, 'jobPostings']);
    Route::post('recruitment/job-postings', [RecruitmentController::class, 'storeJobPosting']);
    Route::get('recruitment/job-postings/{id}', [RecruitmentController::class, 'showJobPosting']);
    Route::put('recruitment/job-postings/{id}', [RecruitmentController::class, 'updateJobPosting']);
    Route::delete('recruitment/job-postings/{id}', [RecruitmentController::class, 'destroyJobPosting']);

    Route::get('recruitment/candidates', [RecruitmentController::class, 'candidates']);
    Route::post('recruitment/candidates', [RecruitmentController::class, 'storeCandidate']);
    Route::get('recruitment/candidates/{id}', [RecruitmentController::class, 'showCandidate']);
    Route::put('recruitment/candidates/{id}', [RecruitmentController::class, 'updateCandidate']);
    Route::delete('recruitment/candidates/{id}', [RecruitmentController::class, 'destroyCandidate']);

    Route::get('recruitment/applications', [RecruitmentController::class, 'applications']);
    Route::post('recruitment/applications', [RecruitmentController::class, 'storeApplication']);
    Route::get('recruitment/applications/{id}', [RecruitmentController::class, 'showApplication']);
    Route::put('recruitment/applications/{id}', [RecruitmentController::class, 'updateApplication']);
    Route::delete('recruitment/applications/{id}', [RecruitmentController::class, 'destroyApplication']);

    // ── Policies ──────────────────────────────────────────────────────────────
    Route::get('policies', [PolicyController::class, 'index']);
    Route::post('policies', [PolicyController::class, 'store']);
    Route::get('policies/{id}', [PolicyController::class, 'show']);
    Route::put('policies/{id}', [PolicyController::class, 'update']);
    Route::delete('policies/{id}', [PolicyController::class, 'destroy']);
    Route::get('policies/categories', [PolicyController::class, 'categories']);
    Route::post('policies/{id}/acknowledge', [PolicyController::class, 'acknowledge']);

    // ── Performance ───────────────────────────────────────────────────────────
    Route::get('performance', [PerformanceController::class, 'index']);
    Route::post('performance', [PerformanceController::class, 'store']);
    Route::get('performance/{id}', [PerformanceController::class, 'show']);
    Route::put('performance/{id}', [PerformanceController::class, 'update']);
    Route::delete('performance/{id}', [PerformanceController::class, 'destroy']);
    Route::get('performance/self', [PerformanceController::class, 'selfAssessment']);
    Route::post('performance/self', [PerformanceController::class, 'submitSelfAssessment']);
    Route::get('performance/team', [PerformanceController::class, 'teamReviews']);

    // ── Announcements & Celebrations ────────────────────────────────────────
    Route::get('announcements', [AnnouncementController::class, 'index']);
    Route::post('announcements', [AnnouncementController::class, 'store']);
    Route::get('announcements/{id}', [AnnouncementController::class, 'show']);
    Route::put('announcements/{id}', [AnnouncementController::class, 'update']);
    Route::delete('announcements/{id}', [AnnouncementController::class, 'destroy']);

    Route::get('celebration-messages', [CelebrationController::class, 'index']);
    Route::post('celebration-messages', [CelebrationController::class, 'store']);
    Route::put('celebration-messages/{id}', [CelebrationController::class, 'update']);
    Route::delete('celebration-messages/{id}', [CelebrationController::class, 'destroy']);

    // ── Notifications ─────────────────────────────────────────────────────────
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('notifications/mark-all-as-read', [NotificationController::class, 'markAllAsRead']);
    Route::post('notifications/{id}/mark-as-read', [NotificationController::class, 'markAsRead']);
    Route::delete('notifications/{id}', [NotificationController::class, 'destroy']);

});
