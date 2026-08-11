<?php
namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\WfhRequest;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class WfhRequestController extends Controller
{
    /** POST /api/wfh-requests */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'employee_id'  => 'required|exists:employees,id',
            'request_date' => 'required|date',
            'reason'       => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $wfhRequest = WfhRequest::create([
            'employee_id'  => $request->employee_id,
            'request_date' => $request->request_date,
            'reason'       => $request->reason,
            'status'       => 'Pending',
        ]);

        $employee     = Employee::find($request->employee_id);
        $employeeName = $employee ? "{$employee->first_name} {$employee->last_name}" : "Employee";

        // Notify line manager
        $lineManagerUser = null;
        if ($employee && $employee->supervisor_id) {
            $lineManagerUser = User::where('employee_id', $employee->supervisor_id)->first();
        }

        if ($lineManagerUser) {
            NotificationService::notify(
                $lineManagerUser,
                'wfh_request_submitted',
                "{$employeeName} is requesting WFH on {$request->request_date}",
                '/approvals/attendance',
                ['wfh_request_id' => $wfhRequest->id]
            );
        }

        return response()->json(['success' => true, 'data' => $wfhRequest], 201);
    }

    /** GET /api/wfh-requests */
    public function index(Request $request): JsonResponse
    {
        $user     = $request->user();
        $userRole = $user->getRoleNames()->first() ?? 'general_employee';
        $query    = WfhRequest::with(['employee:id,first_name,last_name,employee_code']);

        if ($userRole === 'general_employee') {
            $query->where('employee_id', $user->employee_id);
        } elseif ($userRole === 'line_manager') {
            $managerEmployee = Employee::find($user->employee_id);
            $reportIds = $managerEmployee
                ? Employee::where('supervisor_id', $managerEmployee->id)->pluck('id')
                : collect();
            $query->whereIn('employee_id', $reportIds);
        }

        if ($request->has('status'))      $query->where('status', $request->status);
        if ($request->has('employee_id')) $query->where('employee_id', $request->employee_id);

        return response()->json(['success' => true, 'data' => $query->orderByDesc('created_at')->paginate(15)]);
    }

    /** POST /api/wfh-requests/{id}/approve */
    public function approve(Request $request, int $id): JsonResponse
    {
        $user         = $request->user();
        $wfhRequest   = WfhRequest::find($id);
        if (!$wfhRequest) return response()->json(['error' => 'NOT_FOUND'], 404);
        if ($wfhRequest->status !== 'Pending') return response()->json(['error' => 'INVALID_STATUS'], 400);

        $wfhRequest->update([
            'status'          => 'Approved',
            'approved_by'     => $user->id,
            'approved_at'     => now(),
            'approver_notes'  => $request->input('approver_notes'),
        ]);

        $employeeUser = User::where('employee_id', $wfhRequest->employee_id)->first();
        if ($employeeUser) {
            NotificationService::notify($employeeUser, 'wfh_request_approved', 'Your WFH request has been approved', '/attendance', ['wfh_request_id' => $wfhRequest->id]);
        }

        return response()->json(['success' => true, 'data' => $wfhRequest->fresh()]);
    }

    /** POST /api/wfh-requests/{id}/reject */
    public function reject(Request $request, int $id): JsonResponse
    {
        $user       = $request->user();
        $wfhRequest = WfhRequest::find($id);
        if (!$wfhRequest) return response()->json(['error' => 'NOT_FOUND'], 404);
        if ($wfhRequest->status !== 'Pending') return response()->json(['error' => 'INVALID_STATUS'], 400);

        $wfhRequest->update([
            'status'         => 'Rejected',
            'approved_by'    => $user->id,
            'approved_at'    => now(),
            'approver_notes' => $request->input('approver_notes'),
        ]);

        $employeeUser = User::where('employee_id', $wfhRequest->employee_id)->first();
        if ($employeeUser) {
            NotificationService::notify($employeeUser, 'wfh_request_rejected', 'Your WFH request was rejected', '/attendance', ['wfh_request_id' => $wfhRequest->id]);
        }

        return response()->json(['success' => true, 'data' => $wfhRequest->fresh()]);
    }
}
