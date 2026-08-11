<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\AttendanceAuditLog;
use App\Models\Employee;
use App\Models\EarlyClockoutRequest;
use App\Models\LateClockInRequest;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    /**
     * Get attendance records
     */
    public function index(Request $request): JsonResponse
    {
        $currentUser = $request->user();

        $query = Attendance::with('employee:id,first_name,last_name,email,department');

        // Apply department filtering based on user role
        if ($currentUser) {
            // Use Spatie role system instead of old role column
            $userRole = $currentUser->getRoleNames()->first() ?? 'general_employee';

            // Line managers and general employees only see their department
            if (in_array($userRole, ['line_manager', 'general_employee'])) {
                $currentEmployee = Employee::find($currentUser->employee_id);
                if ($currentEmployee && $currentEmployee->department) {
                    // Filter attendance records to only show employees from the same department
                    $departmentEmployeeIds = Employee::where('department', $currentEmployee->department)
                        ->pluck('id');
                    $query->whereIn('employee_id', $departmentEmployeeIds);
                }
            }
            // Executives and HR see all attendance records (no filter)
        }

        // Filter by employee
        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        // Filter by date range
        if ($request->has('start_date')) {
            $query->where('date', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->where('date', '<=', $request->end_date);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $attendance = $query->orderBy('date', 'desc')
                           ->orderBy('created_at', 'desc')
                           ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $attendance
        ]);
    }

    /**
     * Clock in - Smart punch system (4-punch)
     * Supports admin bypass for hr_manager and corporate_hr roles
     */
    public function clockIn(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        $userRole = $currentUser ? $currentUser->getRoleNames()->first() : 'general_employee';
        $isBypassRole = in_array($userRole, ['hr_manager', 'corporate_hr']);

        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:employees,id',
            'location' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
            'approval_reason' => 'nullable|string|max:500',
            'bypass_by_role' => 'nullable|string|in:hr_manager,corporate_hr',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check bypass authorization
        $bypassRole = $request->input('bypass_by_role');
        if ($bypassRole && !$isBypassRole) {
            return response()->json([
                'error' => 'INSUFFICIENT_PERMISSIONS',
                'message' => 'Only HR managers and Corporate HR can use admin bypass'
            ], 403);
        }

        // HR Manager / Corporate HR may clock in outside the window without a separate request
        $canBypassWindow = (bool) $bypassRole || $isBypassRole;
        $effectiveBypassRole = $bypassRole ?? ($isBypassRole ? $userRole : null);

        // Time window validation
        $now = Carbon::now('Africa/Lagos');
        $currentTimeInMinutes = ($now->hour * 60) + $now->minute;
        $clockInStartTime = 7 * 60; // 7:00 AM

        // Determine employee's schedule-based clock-in deadline
        $employee = Employee::find($request->employee_id);
        $schedule = $employee ? $employee->getTodaySchedule() : null;
        $scheduleClockIn = $schedule ? $schedule['clock_in_time'] : '09:00:00';
        [$schHour, $schMin] = explode(':', $scheduleClockIn);
        $clockInDeadline = ((int)$schHour * 60) + (int)$schMin;

        $tooEarly    = $currentTimeInMinutes < $clockInStartTime;
        $isLate      = $currentTimeInMinutes > $clockInDeadline;
        $windowViolation = $tooEarly;

        // Too early — block entirely
        if ($tooEarly && !$canBypassWindow) {
            return response()->json([
                'success'       => false,
                'message'       => 'Clock in is not allowed before 7:00 AM',
                'current_time'  => $now->format('h:i A'),
            ], 403);
        }

        // Late — do NOT block; flag as late and let clock-in proceed
        // The frontend late justification dialog handles the reason capture
        // Status will be set to 'Late' instead of 'Present'

        $today = $now->toDateString();

        // Find existing record for today
        $existingRecord = Attendance::where('employee_id', $request->employee_id)
                                  ->where('date', $today)
                                  ->first();

        if (!$existingRecord) {
            // First clock in of the day - create new record
            // Determine work mode and location verification
            $workMode     = $request->input('work_mode', $schedule['expected_mode'] ?? 'Physical');
            $expectedMode = $schedule['expected_mode'] ?? 'Physical';
            $locationLat  = $request->input('location_lat');
            $locationLng  = $request->input('location_lng');

            $locationVerified = false;
            $locationStatus   = 'Not Required';

            if ($workMode === 'Physical' && $locationLat && $locationLng) {
                $empLocation = $employee->assigned_location ?? $employee->work_location ?? 'Lagos';
                $geoResult   = Attendance::checkGeofence($empLocation, (float)$locationLat, (float)$locationLng);
                $locationVerified = $geoResult['verified'];
                $locationStatus   = $geoResult['status'];
            } elseif ($workMode === 'WFH') {
                $locationStatus = 'Exempt';
                $locationVerified = true;
            }

            // Check for unapproved WFH on a physical day
            $unapprovedWfh = false;
            if ($workMode === 'WFH' && $expectedMode === 'Physical') {
                $approvedWfh = \DB::table('wfh_requests')
                    ->where('employee_id', $request->employee_id)
                    ->where('request_date', $today)
                    ->where('status', 'Approved')
                    ->exists();
                if (!$approvedWfh) $unapprovedWfh = true;
            }

            $attendanceStatus = 'Present';
            if ($unapprovedWfh)       $attendanceStatus = 'Unapproved-WFH';
            elseif ($isLate)          $attendanceStatus = 'Late';
            elseif ($workMode === 'Physical') $attendanceStatus = 'Present-Physical';
            elseif ($workMode === 'WFH')      $attendanceStatus = 'Present-WFH';

            $attendance = Attendance::create([
                'employee_id'      => $request->employee_id,
                'date'             => $today,
                'clock_in'         => $now,
                'location'         => $request->location ?? $workMode,
                'notes'            => $request->notes,
                'status'           => $attendanceStatus,
                'work_mode'        => $workMode,
                'expected_mode'    => $expectedMode,
                'location_lat'     => $locationLat,
                'location_lng'     => $locationLng,
                'location_verified' => $locationVerified,
                'location_status'  => $locationStatus,
            ]);

            // Write audit log when outside normal window or bypass was used
            if ($canBypassWindow || $windowViolation) {
                AttendanceAuditLog::create([
                    'actor_user_id' => $currentUser->id,
                    'target_employee_id' => $request->employee_id,
                    'action' => 'clock_in',
                    'bypass' => $canBypassWindow,
                    'bypass_by_role' => $effectiveBypassRole,
                    'reason' => $request->input('approval_reason') ?: $request->input('notes'),
                    'original_timestamp' => $now,
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Successfully clocked in',
                'action' => 'clock_in',
                'bypass_used' => $canBypassWindow && $windowViolation,
                'data' => $attendance->load('employee:id,first_name,last_name,email,department')
            ]);
        }

        // Check current state
        $hasClockIn = !is_null($existingRecord->clock_in);
        $hasClockOut = !is_null($existingRecord->clock_out);
        $hasBreakStart = !is_null($existingRecord->break_start);
        $hasBreakEnd = !is_null($existingRecord->break_end);

        // If they're working (clocked in but not on break), they can't clock in again
        if ($hasClockIn && !$hasBreakStart) {
            return response()->json([
                'success' => false,
                'message' => 'Already working. Please clock out to start break first.'
            ], 400);
        }

        // If they're on break (break started but not ended), clock in will end the break
        if ($hasClockIn && $hasBreakStart && !$hasBreakEnd) {
            $breakEndTime = $now;
            $breakStartTime = Carbon::parse($existingRecord->break_start);
            $breakDuration = $this->breakDurationMinutes($breakStartTime, $breakEndTime);

            $existingRecord->update([
                'break_end' => $breakEndTime,
                'break_duration' => $breakDuration,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Break ended successfully',
                'action' => 'break_end',
                'data' => $existingRecord->load('employee:id,first_name,last_name,email,department')
            ]);
        }

        // If they've completed all punches, they can't clock in again
        if ($hasClockIn && $hasClockOut && $hasBreakStart && $hasBreakEnd) {
            return response()->json([
                'success' => false,
                'message' => 'All time punches completed for today (4/4)'
            ], 400);
        }

        return response()->json([
            'success' => false,
            'message' => 'Invalid clock in state'
        ], 400);
    }

    /**
     * Clock out - Smart punch system (4-punch)
     * Supports admin bypass for hr_manager and corporate_hr roles
     */
    public function clockOut(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        $userRole = $currentUser ? $currentUser->getRoleNames()->first() : 'general_employee';
        $isBypassRole = in_array($userRole, ['hr_manager', 'corporate_hr']);

        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:employees,id',
            'notes' => 'nullable|string|max:500',
            'approval_reason' => 'nullable|string|max:500',
            'bypass_by_role' => 'nullable|string|in:hr_manager,corporate_hr',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check bypass authorization
        $bypassRole = $request->input('bypass_by_role');
        if ($bypassRole && !$isBypassRole) {
            return response()->json([
                'error' => 'INSUFFICIENT_PERMISSIONS',
                'message' => 'Only HR managers and Corporate HR can use admin bypass'
            ], 403);
        }

        $canBypassWindow = (bool) $bypassRole || $isBypassRole;
        $effectiveBypassRole = $bypassRole ?? ($isBypassRole ? $userRole : null);

        // Early clock-out check (before 17:00 / 5:00 PM)
        $now = Carbon::now('Africa/Lagos');
        $currentTimeInMinutes = ($now->hour * 60) + $now->minute;
        $clockOutEndTime = 17 * 60; // 5:00 PM
        $isEarlyClockout = $currentTimeInMinutes < $clockOutEndTime;

        // Regular staff cannot early clock-out without approval; HR roles may bypass
        if ($isEarlyClockout && ! $canBypassWindow && $userRole === 'general_employee') {
            return response()->json([
                'success' => false,
                'message' => 'Early clock-out requires approval. Submit an early clock-out request.',
                'requires_approval' => true
            ], 400);
        }

        $today = $now->toDateString();

        // Find existing record for today
        $existingRecord = Attendance::where('employee_id', $request->employee_id)
                                  ->where('date', $today)
                                  ->first();

        if (!$existingRecord || !$existingRecord->clock_in) {
            return response()->json([
                'success' => false,
                'message' => 'Must clock in first'
            ], 400);
        }

        // Check current state
        $hasClockIn = !is_null($existingRecord->clock_in);
        $hasClockOut = !is_null($existingRecord->clock_out);
        $hasBreakStart = !is_null($existingRecord->break_start);
        $hasBreakEnd = !is_null($existingRecord->break_end);

        // If they're working (clocked in but not on break), clock out will start break
        if ($hasClockIn && !$hasBreakStart) {
            $breakStartTime = $now;
            $clockInTime = Carbon::parse($existingRecord->clock_in);
            $initialMinutes = $this->workedMinutes($clockInTime, $breakStartTime);

            $existingRecord->update([
                'break_start' => $breakStartTime,
                'total_hours' => $initialMinutes,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Break started successfully',
                'action' => 'break_start',
                'data' => $existingRecord->load('employee:id,first_name,last_name,email,department')
            ]);
        }

        // If they're on break (break started but not ended), they can't clock out yet
        if ($hasClockIn && $hasBreakStart && !$hasBreakEnd) {
            return response()->json([
                'success' => false,
                'message' => 'On break. Please clock in to end break first.'
            ], 400);
        }

        // If break ended but not final clock out, clock out will end shift
        if ($hasClockIn && $hasBreakStart && $hasBreakEnd && !$hasClockOut) {
            $clockOutTime = $now;
            $breakEndTime = Carbon::parse($existingRecord->break_end);
            $additionalMinutes = $this->workedMinutes($breakEndTime, $clockOutTime);
            $totalMinutes = ($existingRecord->getRawOriginal('total_hours') ?? 0) + $additionalMinutes;

            $existingRecord->update([
                'clock_out' => $clockOutTime,
                'total_hours' => $totalMinutes,
            ]);

            // Write audit log for early clock-outs
            if ($isEarlyClockout && ($canBypassWindow || $request->input('approval_reason'))) {
                AttendanceAuditLog::create([
                    'actor_user_id' => $currentUser->id,
                    'target_employee_id' => $request->employee_id,
                    'action' => 'clock_out',
                    'bypass' => $canBypassWindow,
                    'bypass_by_role' => $effectiveBypassRole,
                    'reason' => $request->input('approval_reason') ?: $request->input('notes'),
                    'original_timestamp' => $clockOutTime,
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Shift ended successfully',
                'action' => 'shift_end',
                'data' => $existingRecord->load('employee:id,first_name,last_name,email,department')
            ]);
        }

        // If they've completed all punches, they can't clock out again
        if ($hasClockIn && $hasClockOut && $hasBreakStart && $hasBreakEnd) {
            return response()->json([
                'success' => false,
                'message' => 'All time punches completed for today (4/4)'
            ], 400);
        }

        return response()->json([
            'success' => false,
            'message' => 'Invalid clock out state'
        ], 400);
    }

    /**
     * Get today's attendance status
     */
    public function todayStatus(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:employees,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $today = Carbon::today();

        $attendance = Attendance::where('employee_id', $request->employee_id)
                              ->where('date', $today)
                              ->first();

        $status = [
            'is_clocked_in' => false,
            'is_clocked_out' => false,
            'clock_in_time' => null,
            'clock_out_time' => null,
            'total_hours' => null,
            'break_duration' => null,
            'status' => 'not_started'
        ];

        if ($attendance) {
            $status = [
                'is_clocked_in' => !is_null($attendance->clock_in),
                'is_clocked_out' => !is_null($attendance->clock_out),
                'clock_in_time' => $attendance->clock_in,
                'clock_out_time' => $attendance->clock_out,
                'total_hours' => $attendance->total_hours,
                'break_duration' => $attendance->break_duration,
                'status' => $attendance->status
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $status
        ]);
    }

    /**
     * Get attendance statistics
     */
    public function statistics(Request $request): JsonResponse
    {
        $query = Attendance::query();

        // Filter by date range
        if ($request->has('start_date')) {
            $query->where('date', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->where('date', '<=', $request->end_date);
        }

        $stats = [
            'total_days' => $query->count(),
            'present_days' => $query->where('status', 'present')->count(),
            'absent_days' => $query->where('status', 'absent')->count(),
            'late_days' => $query->where('status', 'late')->count(),
            'total_hours' => $query->sum('total_hours') / 60, // Convert minutes to hours
            'average_hours_per_day' => $query->whereNotNull('total_hours')->avg('total_hours') / 60,
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Get daily attendance summary for an employee
     */
    public function getDailySummary(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:employees,id',
            'date' => 'nullable|date'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $date = $request->date ? Carbon::parse($request->date) : Carbon::today();

        $attendanceRecords = Attendance::where('employee_id', $request->employee_id)
                                     ->where('date', $date)
                                     ->whereNotNull('clock_out')
                                     ->get();

        $totalHours = $attendanceRecords->sum('total_hours');
        $sessionCount = $attendanceRecords->count();

        return response()->json([
            'success' => true,
            'data' => [
                'date' => $date->format('Y-m-d'),
                'total_hours' => $totalHours,
                'session_count' => $sessionCount,
                'sessions' => $attendanceRecords
            ]
        ]);
    }

    /**
     * Start lunch break
     * POST /attendance/lunch-start
     * Supports admin bypass for hr_manager and corporate_hr roles
     * Normal window: outside 12:00–14:00 (noon–2 PM)
     */
    public function lunchStart(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        $userRole = $currentUser ? $currentUser->getRoleNames()->first() : 'general_employee';
        $isBypassRole = in_array($userRole, ['hr_manager', 'corporate_hr']);

        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:employees,id',
            'notes' => 'nullable|string|max:500',
            'approval_reason' => 'nullable|string|max:500',
            'bypass_by_role' => 'nullable|string|in:hr_manager,corporate_hr',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check bypass authorization
        $bypassRole = $request->input('bypass_by_role');
        if ($bypassRole && !$isBypassRole) {
            return response()->json([
                'error' => 'INSUFFICIENT_PERMISSIONS',
                'message' => 'Only HR managers and Corporate HR can use admin bypass'
            ], 403);
        }

        $canBypassWindow = (bool) $bypassRole || $isBypassRole;
        $effectiveBypassRole = $bypassRole ?? ($isBypassRole ? $userRole : null);

        // Lunch break window check (allowed outside 12:00–14:00)
        $now = Carbon::now('Africa/Lagos');
        $currentTimeInMinutes = ($now->hour * 60) + $now->minute;
        $lunchStartTime = 12 * 60; // 12:00 PM
        $lunchEndTime = 14 * 60; // 2:00 PM
        $withinLunchWindow = $currentTimeInMinutes >= $lunchStartTime && $currentTimeInMinutes <= $lunchEndTime;

        // Regular staff cannot start break during 12:00–14:00 window without bypass
        if ($withinLunchWindow && !$canBypassWindow && $userRole === 'general_employee') {
            return response()->json([
                'success' => false,
                'message' => 'Lunch break can only be taken outside 12:00 PM - 2:00 PM',
                'current_time' => $now->format('h:i A'),
                'allowed_window' => 'Outside 12:00 PM - 2:00 PM'
            ], 403);
        }

        $today = $now->toDateString();

        // Find existing record for today
        $existingRecord = Attendance::where('employee_id', $request->employee_id)
                                  ->where('date', $today)
                                  ->first();

        if (!$existingRecord || !$existingRecord->clock_in) {
            return response()->json([
                'success' => false,
                'message' => 'Must clock in first'
            ], 400);
        }

        // Check current state
        $hasClockIn = !is_null($existingRecord->clock_in);
        $hasBreakStart = !is_null($existingRecord->break_start);
        $hasBreakEnd = !is_null($existingRecord->break_end);

        // Can only start break if clocked in and not already on break
        if (!$hasClockIn) {
            return response()->json([
                'success' => false,
                'message' => 'Must clock in first'
            ], 400);
        }

        if ($hasBreakStart && !$hasBreakEnd) {
            return response()->json([
                'success' => false,
                'message' => 'Already on break. Please end break first.'
            ], 400);
        }

        if ($hasBreakStart && $hasBreakEnd) {
            return response()->json([
                'success' => false,
                'message' => 'Lunch break already taken today. Cannot start another.'
            ], 400);
        }

        // Start lunch break
        $breakStartTime = $now;
        $clockInTime = Carbon::parse($existingRecord->clock_in);
        $initialMinutes = $this->workedMinutes($clockInTime, $breakStartTime);

        $existingRecord->update([
            'break_start' => $breakStartTime,
            'total_hours' => $initialMinutes,
        ]);

        // Write audit log if window violation or bypass used
        if ($withinLunchWindow && ($canBypassWindow || $request->input('approval_reason'))) {
            AttendanceAuditLog::create([
                'actor_user_id' => $currentUser->id,
                'target_employee_id' => $request->employee_id,
                'action' => 'lunch_start',
                'bypass' => $canBypassWindow,
                'bypass_by_role' => $effectiveBypassRole,
                'reason' => $request->input('approval_reason') ?: $request->input('notes'),
                'original_timestamp' => $breakStartTime,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Lunch break started successfully',
            'action' => 'lunch_start',
            'bypass_used' => $canBypassWindow && $withinLunchWindow,
            'data' => $existingRecord->load('employee:id,first_name,last_name,email,department')
        ]);
    }

    /**
     * End lunch break
     * POST /attendance/lunch-end
     * Supports admin bypass for hr_manager and corporate_hr roles
     * Normal window: outside 12:00–14:00 (noon–2 PM)
     */
    public function lunchEnd(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        $userRole = $currentUser ? $currentUser->getRoleNames()->first() : 'general_employee';
        $isBypassRole = in_array($userRole, ['hr_manager', 'corporate_hr']);

        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:employees,id',
            'notes' => 'nullable|string|max:500',
            'approval_reason' => 'nullable|string|max:500',
            'bypass_by_role' => 'nullable|string|in:hr_manager,corporate_hr',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check bypass authorization
        $bypassRole = $request->input('bypass_by_role');
        if ($bypassRole && !$isBypassRole) {
            return response()->json([
                'error' => 'INSUFFICIENT_PERMISSIONS',
                'message' => 'Only HR managers and Corporate HR can use admin bypass'
            ], 403);
        }

        $canBypassWindow = (bool) $bypassRole || $isBypassRole;
        $effectiveBypassRole = $bypassRole ?? ($isBypassRole ? $userRole : null);

        // Lunch break window check (allowed outside 12:00–14:00)
        $now = Carbon::now('Africa/Lagos');
        $currentTimeInMinutes = ($now->hour * 60) + $now->minute;
        $lunchStartTime = 12 * 60; // 12:00 PM
        $lunchEndTime = 14 * 60; // 2:00 PM
        $withinLunchWindow = $currentTimeInMinutes >= $lunchStartTime && $currentTimeInMinutes <= $lunchEndTime;

        // Regular staff cannot end break during 12:00–14:00 window without bypass
        if ($withinLunchWindow && !$canBypassWindow && $userRole === 'general_employee') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot end lunch break during 12:00 PM - 2:00 PM window. Must end outside this time.',
                'current_time' => $now->format('h:i A'),
                'allowed_window' => 'Outside 12:00 PM - 2:00 PM'
            ], 403);
        }

        $today = $now->toDateString();

        // Find existing record for today
        $existingRecord = Attendance::where('employee_id', $request->employee_id)
                                  ->where('date', $today)
                                  ->first();

        if (!$existingRecord || !$existingRecord->clock_in) {
            return response()->json([
                'success' => false,
                'message' => 'Must clock in first'
            ], 400);
        }

        // Check current state
        $hasBreakStart = !is_null($existingRecord->break_start);
        $hasBreakEnd = !is_null($existingRecord->break_end);

        // Can only end break if on break
        if (!$hasBreakStart) {
            return response()->json([
                'success' => false,
                'message' => 'Not on break. Must start break first.'
            ], 400);
        }

        if ($hasBreakEnd) {
            return response()->json([
                'success' => false,
                'message' => 'Break already ended.'
            ], 400);
        }

        // End lunch break
        $breakEndTime = $now;
        $breakStartTime = Carbon::parse($existingRecord->break_start);
        $breakDuration = $this->breakDurationMinutes($breakStartTime, $breakEndTime);

        $existingRecord->update([
            'break_end' => $breakEndTime,
            'break_duration' => $breakDuration,
        ]);

        // Write audit log if window violation or bypass used
        if ($withinLunchWindow && ($canBypassWindow || $request->input('approval_reason'))) {
            AttendanceAuditLog::create([
                'actor_user_id' => $currentUser->id,
                'target_employee_id' => $request->employee_id,
                'action' => 'lunch_end',
                'bypass' => $canBypassWindow,
                'bypass_by_role' => $effectiveBypassRole,
                'reason' => $request->input('approval_reason') ?: $request->input('notes'),
                'original_timestamp' => $breakEndTime,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Lunch break ended successfully',
            'action' => 'lunch_end',
            'bypass_used' => $canBypassWindow && $withinLunchWindow,
            'data' => $existingRecord->load('employee:id,first_name,last_name,email,department')
        ]);
    }

    /**
     * Submit an early clock-out request
     * POST /attendance/early-clockout-request
     */
    public function submitEarlyClockoutRequest(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:employees,id',
            'reason' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'reason' => 'required|string|max:1000',
        ]);

        // Create early clock-out request
        $clockoutRequest = EarlyClockoutRequest::create([
            'employee_id' => $request->employee_id,
            'reason' => $request->reason,
            'requested_at' => now(),
            'status' => 'pending',
        ]);

        // Send notification to HR Managers and Corporate HR
        $employee = Employee::find($request->employee_id);
        $employeeName = $employee ? "{$employee->first_name} {$employee->last_name}" : "Employee #{$request->employee_id}";

        $approvers = User::role(['hr_manager', 'corporate_hr'])->get();
        $notificationTemplate = NotificationService::earlyClockoutRequestSubmitted(
            $clockoutRequest->id,
            $request->employee_id,
            $employeeName,
            $request->reason
        );
        NotificationService::notifyMultiple(
            $approvers,
            $notificationTemplate['type'],
            $notificationTemplate['message'],
            $notificationTemplate['link'] ?? null,
            $notificationTemplate['data'] ?? null
        );

        return response()->json([
            'success' => true,
            'message' => 'Early clock-out request submitted',
            'data' => $clockoutRequest
        ], 201);
    }

    /**
     * Get early clock-out requests (for approvers)
     * GET /attendance/early-clockout-requests?status=pending
     */
    public function getEarlyClockoutRequests(Request $request): JsonResponse
    {
        $user = $request->user();
        $userRole = $user->getRoleNames()->first() ?? 'general_employee';

        // Only HR managers, Corporate HR, and Executives can view
        if (!in_array($userRole, ['hr_manager', 'corporate_hr', 'executive'])) {
            return response()->json([
                'error' => 'INSUFFICIENT_PERMISSIONS',
                'message' => 'Only HR managers and Corporate HR can view early clock-out requests'
            ], 403);
        }

        $query = EarlyClockoutRequest::with(['employee:id,first_name,last_name,email,employee_code', 'approver:id,first_name,last_name,email']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        $requests = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $requests
        ]);
    }

    /**
     * Approve an early clock-out request
     * POST /attendance/early-clockout-requests/{id}/approve
     */
    public function approveEarlyClockout(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $userRole = $user->getRoleNames()->first() ?? 'general_employee';

        // Only HR managers, Corporate HR, and Executives can approve
        if (!in_array($userRole, ['hr_manager', 'corporate_hr', 'executive'])) {
            return response()->json([
                'error' => 'INSUFFICIENT_PERMISSIONS',
                'message' => 'Only HR managers and Corporate HR can approve early clock-out requests'
            ], 403);
        }

        $clockoutRequest = EarlyClockoutRequest::find($id);

        if (!$clockoutRequest) {
            return response()->json([
                'error' => 'NOT_FOUND',
                'message' => 'Early clock-out request not found'
            ], 404);
        }

        // Self-approval guard
        if ($clockoutRequest->employee_id == $user->employee_id && in_array($userRole, ['hr_manager', 'corporate_hr'])) {
            return response()->json([
                'error' => 'SELF_APPROVAL_NOT_ALLOWED',
                'message' => 'You cannot approve your own early clock-out request'
            ], 403);
        }

        if ($clockoutRequest->status !== 'pending') {
            return response()->json([
                'error' => 'INVALID_STATUS',
                'message' => 'Only pending requests can be approved'
            ], 400);
        }

        // Update request status
        $clockoutRequest->update([
            'status' => 'approved',
            'approver_user_id' => $user->id,
            'approver_notes' => $request->input('approver_notes'),
            'decided_at' => now(),
        ]);

        // Perform the actual clock-out at the requested time
        $attendance = Attendance::where('employee_id', $clockoutRequest->employee_id)
            ->where('date', $clockoutRequest->requested_at->toDateString())
            ->first();

        if ($attendance && !$attendance->clock_out) {
            $attendance->update([
                'clock_out' => $clockoutRequest->requested_at,
            ]);

            // Write audit log
            AttendanceAuditLog::create([
                'actor_user_id' => $user->id,
                'target_employee_id' => $clockoutRequest->employee_id,
                'action' => 'early_clock_out_approved',
                'bypass' => false,
                'reason' => $clockoutRequest->reason,
                'original_timestamp' => $clockoutRequest->requested_at,
                'approved_timestamp' => now(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        }

        // Send notification to employee
        $employee = Employee::find($clockoutRequest->employee_id);
        $employeeName = $employee ? "{$employee->first_name} {$employee->last_name}" : "Employee";
        $employeeUser = User::where('employee_id', $clockoutRequest->employee_id)->first();

        if ($employeeUser) {
            $notificationTemplate = NotificationService::earlyClockoutRequestApproved($employeeName);
            NotificationService::notify(
                $employeeUser,
                $notificationTemplate['type'],
                $notificationTemplate['message'],
                null,
                $notificationTemplate['data'] ?? null
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Early clock-out request approved',
            'data' => $clockoutRequest->fresh()
        ]);
    }

    /**
     * Reject an early clock-out request
     * POST /attendance/early-clockout-requests/{id}/reject
     */
    public function rejectEarlyClockout(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $userRole = $user->getRoleNames()->first() ?? 'general_employee';

        // Only HR managers, Corporate HR, and Executives can reject
        if (!in_array($userRole, ['hr_manager', 'corporate_hr', 'executive'])) {
            return response()->json([
                'error' => 'INSUFFICIENT_PERMISSIONS',
                'message' => 'Only HR managers and Corporate HR can reject early clock-out requests'
            ], 403);
        }

        $clockoutRequest = EarlyClockoutRequest::find($id);

        if (!$clockoutRequest) {
            return response()->json([
                'error' => 'NOT_FOUND',
                'message' => 'Early clock-out request not found'
            ], 404);
        }

        if ($clockoutRequest->status !== 'pending') {
            return response()->json([
                'error' => 'INVALID_STATUS',
                'message' => 'Only pending requests can be rejected'
            ], 400);
        }

        $approverNotes = $request->input('approver_notes', '');

        // Update request status
        $clockoutRequest->update([
            'status' => 'rejected',
            'approver_user_id' => $user->id,
            'approver_notes' => $approverNotes,
            'decided_at' => now(),
        ]);

        // Write audit log
        AttendanceAuditLog::create([
            'actor_user_id' => $user->id,
            'target_employee_id' => $clockoutRequest->employee_id,
            'action' => 'early_clock_out_rejected',
            'bypass' => false,
            'reason' => $approverNotes ?: 'Request rejected without reason',
            'original_timestamp' => $clockoutRequest->requested_at,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        // Send notification to employee
        $employee = Employee::find($clockoutRequest->employee_id);
        $employeeName = $employee ? "{$employee->first_name} {$employee->last_name}" : "Employee";
        $employeeUser = User::where('employee_id', $clockoutRequest->employee_id)->first();

        if ($employeeUser) {
            $notificationTemplate = NotificationService::earlyClockoutRequestRejected($employeeName, $approverNotes ?: null);
            NotificationService::notify(
                $employeeUser,
                $notificationTemplate['type'],
                $notificationTemplate['message'],
                null,
                $notificationTemplate['data'] ?? null
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Early clock-out request rejected',
            'data' => $clockoutRequest->fresh()
        ]);
    }

    /**
     * Submit a late clock-in request
     * POST /attendance/late-clockin-request
     */
    public function submitLateClockInRequest(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:employees,id',
            'reason' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Create late clock-in request
        $clockinRequest = LateClockInRequest::create([
            'employee_id' => $request->employee_id,
            'reason' => $request->reason,
            'requested_at' => now(),
            'status' => 'pending',
        ]);

        // Send notification to HR Managers and Corporate HR
        $employee = Employee::find($request->employee_id);
        $employeeName = $employee ? "{$employee->first_name} {$employee->last_name}" : "Employee #{$request->employee_id}";

        $approvers = User::role(['hr_manager', 'corporate_hr'])->get();
        $notificationTemplate = NotificationService::lateClockInRequestSubmitted(
            $clockinRequest->id,
            $request->employee_id,
            $employeeName,
            $request->reason
        );
        NotificationService::notifyMultiple(
            $approvers,
            $notificationTemplate['type'],
            $notificationTemplate['message'],
            $notificationTemplate['link'] ?? null,
            $notificationTemplate['data'] ?? null
        );

        return response()->json([
            'success' => true,
            'message' => 'Late clock-in request submitted',
            'data' => $clockinRequest
        ], 201);
    }

    /**
     * Get late clock-in requests (for approvers)
     * GET /attendance/late-clockin-requests?status=pending
     */
    public function getLateClockinRequests(Request $request): JsonResponse
    {
        $user = $request->user();
        $userRole = $user->getRoleNames()->first() ?? 'general_employee';

        // Only HR managers, Corporate HR, and Executives can view
        if (!in_array($userRole, ['hr_manager', 'corporate_hr', 'executive'])) {
            return response()->json([
                'error' => 'INSUFFICIENT_PERMISSIONS',
                'message' => 'Only HR managers and Corporate HR can view late clock-in requests'
            ], 403);
        }

        $query = LateClockInRequest::with(['employee:id,first_name,last_name,email,employee_code', 'approver:id,first_name,last_name,email']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        $requests = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $requests
        ]);
    }

    /**
     * Approve a late clock-in request
     * POST /attendance/late-clockin-requests/{id}/approve
     */
    public function approveLateClockin(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $userRole = $user->getRoleNames()->first() ?? 'general_employee';

        // Only HR managers, Corporate HR, and Executives can approve
        if (!in_array($userRole, ['hr_manager', 'corporate_hr', 'executive'])) {
            return response()->json([
                'error' => 'INSUFFICIENT_PERMISSIONS',
                'message' => 'Only HR managers and Corporate HR can approve late clock-in requests'
            ], 403);
        }

        $clockinRequest = LateClockInRequest::find($id);

        if (!$clockinRequest) {
            return response()->json([
                'error' => 'NOT_FOUND',
                'message' => 'Late clock-in request not found'
            ], 404);
        }

        // Self-approval guard
        if ($clockinRequest->employee_id == $user->employee_id && in_array($userRole, ['hr_manager', 'corporate_hr'])) {
            return response()->json([
                'error' => 'SELF_APPROVAL_NOT_ALLOWED',
                'message' => 'You cannot approve your own late clock-in request'
            ], 403);
        }

        if ($clockinRequest->status !== 'pending') {
            return response()->json([
                'error' => 'INVALID_STATUS',
                'message' => 'Only pending requests can be approved'
            ], 400);
        }

        // Update request status
        $clockinRequest->update([
            'status' => 'approved',
            'approver_user_id' => $user->id,
            'approver_notes' => $request->input('approver_notes'),
            'decided_at' => now(),
        ]);

        // Perform the actual clock-in at the requested time
        $attendance = Attendance::where('employee_id', $clockinRequest->employee_id)
            ->where('date', $clockinRequest->requested_at->toDateString())
            ->first();

        if (!$attendance) {
            // Create a new attendance record with the requested clock-in time
            $attendance = Attendance::create([
                'employee_id' => $clockinRequest->employee_id,
                'date' => $clockinRequest->requested_at->toDateString(),
                'clock_in' => $clockinRequest->requested_at,
                'location' => 'office',
                'status' => 'late',
            ]);
        } else {
            // Update existing record if clock_in is not set
            if (!$attendance->clock_in) {
                $attendance->update([
                    'clock_in' => $clockinRequest->requested_at,
                ]);
            }
        }

        // Write audit log
        AttendanceAuditLog::create([
            'actor_user_id' => $user->id,
            'target_employee_id' => $clockinRequest->employee_id,
            'action' => 'late_clock_in_approved',
            'bypass' => false,
            'reason' => $clockinRequest->reason,
            'original_timestamp' => $clockinRequest->requested_at,
            'approved_timestamp' => now(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        // Send notification to employee
        $employee = Employee::find($clockinRequest->employee_id);
        $employeeName = $employee ? "{$employee->first_name} {$employee->last_name}" : "Employee";
        $employeeUser = User::where('employee_id', $clockinRequest->employee_id)->first();

        if ($employeeUser) {
            $notificationTemplate = NotificationService::lateClockInRequestApproved($employeeName);
            NotificationService::notify(
                $employeeUser,
                $notificationTemplate['type'],
                $notificationTemplate['message'],
                null,
                $notificationTemplate['data'] ?? null
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Late clock-in request approved',
            'data' => $clockinRequest->fresh()
        ]);
    }

    /**
     * Reject a late clock-in request
     * POST /attendance/late-clockin-requests/{id}/reject
     */
    public function rejectLateClockin(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $userRole = $user->getRoleNames()->first() ?? 'general_employee';

        // Only HR managers, Corporate HR, and Executives can reject
        if (!in_array($userRole, ['hr_manager', 'corporate_hr', 'executive'])) {
            return response()->json([
                'error' => 'INSUFFICIENT_PERMISSIONS',
                'message' => 'Only HR managers and Corporate HR can reject late clock-in requests'
            ], 403);
        }

        $clockinRequest = LateClockInRequest::find($id);

        if (!$clockinRequest) {
            return response()->json([
                'error' => 'NOT_FOUND',
                'message' => 'Late clock-in request not found'
            ], 404);
        }

        if ($clockinRequest->status !== 'pending') {
            return response()->json([
                'error' => 'INVALID_STATUS',
                'message' => 'Only pending requests can be rejected'
            ], 400);
        }

        $approverNotes = $request->input('approver_notes', '');

        // Update request status
        $clockinRequest->update([
            'status' => 'rejected',
            'approver_user_id' => $user->id,
            'approver_notes' => $approverNotes,
            'decided_at' => now(),
        ]);

        // Write audit log
        AttendanceAuditLog::create([
            'actor_user_id' => $user->id,
            'target_employee_id' => $clockinRequest->employee_id,
            'action' => 'late_clock_in_rejected',
            'bypass' => false,
            'reason' => $approverNotes ?: 'Request rejected without reason',
            'original_timestamp' => $clockinRequest->requested_at,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        // Send notification to employee
        $employee = Employee::find($clockinRequest->employee_id);
        $employeeName = $employee ? "{$employee->first_name} {$employee->last_name}" : "Employee";
        $employeeUser = User::where('employee_id', $clockinRequest->employee_id)->first();

        if ($employeeUser) {
            $notificationTemplate = NotificationService::lateClockInRequestRejected($employeeName, $approverNotes ?: null);
            NotificationService::notify(
                $employeeUser,
                $notificationTemplate['type'],
                $notificationTemplate['message'],
                null,
                $notificationTemplate['data'] ?? null
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Late clock-in request rejected',
            'data' => $clockinRequest->fresh()
        ]);
    }

    /**
     * Whole minutes between break start and end (DB column is integer).
     */
    private function breakDurationMinutes(Carbon $breakStart, Carbon $breakEnd): int
    {
        return (int) round($breakEnd->diffInMinutes($breakStart, true));
    }

    /**
     * Whole minutes worked between two timestamps (DB column is integer).
     */
    private function workedMinutes(Carbon $start, Carbon $end): int
    {
        return (int) round($end->diffInMinutes($start, true));
    }

    /**
     * GET /api/attendance/schedule-config
     * Returns full schedule matrix per location and day
     */
    public function scheduleConfig(Request $request): JsonResponse
    {
        $schedules = \DB::table('attendance_schedules')
            ->orderBy('location')
            ->orderBy('day_of_week')
            ->get();

        $matrix = [];
        foreach ($schedules as $s) {
            $matrix[$s->location][$s->day_of_week] = [
                'expected_mode'  => $s->expected_mode,
                'clock_in_time'  => $s->clock_in_time,
                'clock_out_time' => $s->clock_out_time,
            ];
        }

        return response()->json(['success' => true, 'data' => $matrix]);
    }

    /**
     * GET /api/attendance/schedule-config/{location}/{day}
     */
    public function scheduleConfigForDay(Request $request, string $location, string $day): JsonResponse
    {
        $schedule = \DB::table('attendance_schedules')
            ->where('location', $location)
            ->where('day_of_week', $day)
            ->first();

        if (!$schedule) {
            return response()->json(['success' => false, 'message' => 'Schedule not found'], 404);
        }

        return response()->json(['success' => true, 'data' => $schedule]);
    }

    /**
     * GET /api/employees/{id}/attendance-profile
     */
    public function employeeAttendanceProfile(Request $request, int $id): JsonResponse
    {
        $employee = Employee::find($id);
        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'Employee not found'], 404);
        }

        $schedule = $employee->getTodaySchedule();

        return response()->json([
            'success' => true,
            'data' => [
                'employee_id'       => $employee->id,
                'employee_name'     => "{$employee->first_name} {$employee->last_name}",
                'assigned_location' => $employee->assigned_location ?? $employee->work_location,
                'work_arrangement'  => $employee->work_arrangement,
                'today_schedule'    => $schedule,
                'supervisor_name'   => $employee->supervisor_name,
                'supervisor_id'     => $employee->supervisor_id,
            ]
        ]);
    }

    /**
     * PUT /api/employees/{id}/attendance-profile
     * HR only — update work arrangement and assigned location
     */
    public function updateEmployeeAttendanceProfile(Request $request, int $id): JsonResponse
    {
        $user     = $request->user();
        $userRole = $user->getRoleNames()->first() ?? 'general_employee';

        if (!in_array($userRole, ['hr_manager', 'corporate_hr', 'executive'])) {
            return response()->json(['error' => 'INSUFFICIENT_PERMISSIONS'], 403);
        }

        $validator = Validator::make($request->all(), [
            'work_arrangement'  => 'nullable|string|in:Hybrid,Fully Onsite,Fully Remote',
            'assigned_location' => 'nullable|string|in:Lagos,Calabar,Abuja',
            'supervisor_id'     => 'nullable|exists:employees,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $employee = Employee::find($id);
        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'Employee not found'], 404);
        }

        $employee->update($request->only(['work_arrangement', 'assigned_location', 'supervisor_id']));

        return response()->json([
            'success' => true,
            'message' => 'Attendance profile updated',
            'data'    => $employee->fresh()
        ]);
    }

    /**
     * GET /api/attendance/org-dashboard
     * Org-wide attendance view for HR — includes absent employees
     */
    public function orgDashboard(Request $request): JsonResponse
    {
        $user     = $request->user();
        $userRole = $user->getRoleNames()->first() ?? 'general_employee';

        if (!in_array($userRole, ['hr_manager', 'corporate_hr', 'executive'])) {
            return response()->json(['error' => 'INSUFFICIENT_PERMISSIONS'], 403);
        }

        $date = $request->get('date', Carbon::now('Africa/Lagos')->toDateString());

        // Get all active employees
        $employeeQuery = Employee::where('employment_status', 'Active');

        if ($request->has('location') && $request->location !== 'all') {
            $employeeQuery->where(function($q) use ($request) {
                $q->where('assigned_location', $request->location)
                  ->orWhere('work_location', $request->location);
            });
        }

        if ($request->has('department') && $request->department !== 'all') {
            $employeeQuery->where('department', $request->department);
        }

        $employees = $employeeQuery->get();

        // Get attendance records for the date
        $attendanceRecords = Attendance::where('date', $date)
            ->whereIn('employee_id', $employees->pluck('id'))
            ->get()
            ->keyBy('employee_id');

        // Get approved exception requests covering this date
        $exceptionRequests = \DB::table('exception_requests')
            ->where('status', 'Approved')
            ->where('start_date', '<=', $date)
            ->where('end_date', '>=', $date)
            ->whereIn('employee_id', $employees->pluck('id'))
            ->get()
            ->keyBy('employee_id');

        $dayOfWeek = Carbon::parse($date)->format('l');
        $rows      = [];

        foreach ($employees as $emp) {
            $location  = $emp->assigned_location ?? $emp->work_location ?? 'Lagos';
            $schedule  = \DB::table('attendance_schedules')
                ->where('location', $location)
                ->where('day_of_week', $dayOfWeek)
                ->first();

            $expectedMode  = $schedule ? $schedule->expected_mode : 'Physical';
            $attendance    = $attendanceRecords->get($emp->id);
            $exception     = $exceptionRequests->get($emp->id);

            if ($exception) {
                $attendanceStatus = strtoupper($exception->request_type) . ' — APPROVED';
            } elseif (!$attendance) {
                $attendanceStatus = 'Absent';
            } else {
                $attendanceStatus = $attendance->status ?? 'Present';
            }

            $rows[] = [
                'employee_id'        => $emp->id,
                'employee_code'      => $emp->employee_code,
                'employee_name'      => "{$emp->first_name} {$emp->last_name}",
                'department'         => $emp->department,
                'assigned_location'  => $location,
                'work_arrangement'   => $emp->work_arrangement,
                'expected_mode'      => $expectedMode,
                'clock_in'           => $attendance?->clock_in ? Carbon::parse($attendance->clock_in)->format('H:i') : null,
                'clock_out'          => $attendance?->clock_out ? Carbon::parse($attendance->clock_out)->format('H:i') : null,
                'work_mode'          => $attendance?->work_mode,
                'location_verified'  => $attendance?->location_verified ?? false,
                'location_status'    => $attendance?->location_status,
                'attendance_status'  => $attendanceStatus,
                'exception'          => $exception ? $exception->request_type : null,
                'justification_status' => $attendance?->justification_status ?? 'None',
            ];
        }

        // Summary
        $summary = [
            'total'             => count($rows),
            'present_physical'  => collect($rows)->where('attendance_status', 'Present-Physical')->count(),
            'present_wfh'       => collect($rows)->where('attendance_status', 'Present-WFH')->count(),
            'absent'            => collect($rows)->where('attendance_status', 'Absent')->count(),
            'on_exception'      => collect($rows)->filter(fn($r) => str_contains($r['attendance_status'], 'APPROVED'))->count(),
            'unapproved_wfh'    => collect($rows)->where('attendance_status', 'Unapproved-WFH')->count(),
            'location_mismatch' => collect($rows)->where('location_status', 'Mismatch')->count(),
        ];

        return response()->json([
            'success'  => true,
            'date'     => $date,
            'data'     => $rows,
            'summary'  => $summary,
        ]);
    }
}
