<?php
namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\ExceptionRequest;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class ExceptionRequestController extends Controller
{
    /** POST /api/exception-requests */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'employee_id'  => 'required|exists:employees,id',
            'request_type' => 'required|string|in:Official Duty,Business Travel,Training,Site Assignment,Client Assignment,Temporary Location,Other',
            'start_date'   => 'required|date',
            'end_date'     => 'required|date|after_or_equal:start_date',
            'description'  => 'nullable|string|max:2000',
            'document'     => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $documentPath = null;
        if ($request->hasFile('document')) {
            $documentPath = $request->file('document')->store('exception-docs', 's3');
        }

        $exceptionRequest = ExceptionRequest::create([
            'employee_id'  => $request->employee_id,
            'request_type' => $request->request_type,
            'start_date'   => $request->start_date,
            'end_date'     => $request->end_date,
            'description'  => $request->description,
            'document_path' => $documentPath,
            'status'       => 'Pending',
        ]);

        // Notify line manager
        $employee = Employee::find($request->employee_id);
        $employeeName = $employee ? "{$employee->first_name} {$employee->last_name}" : "Employee";

        $lineManagerUser = null;
        if ($employee && $employee->supervisor_id) {
            $lineManagerUser = User::where('employee_id', $employee->supervisor_id)->first();
        }
        if (!$lineManagerUser && $employee && $employee->supervisor_name) {
            $supervisorEmployee = Employee::where('first_name', 'LIKE', '%' . explode(' ', $employee->supervisor_name)[0] . '%')->first();
            if ($supervisorEmployee) {
                $lineManagerUser = User::where('employee_id', $supervisorEmployee->id)->first();
            }
        }

        if ($lineManagerUser) {
            NotificationService::notify(
                $lineManagerUser,
                'exception_request_submitted',
                "{$employeeName} submitted a {$request->request_type} request from {$request->start_date} to {$request->end_date}",
                '/approvals/attendance',
                ['exception_request_id' => $exceptionRequest->id]
            );
        }

        return response()->json(['success' => true, 'data' => $exceptionRequest], 201);
    }

    /** GET /api/exception-requests */
    public function index(Request $request): JsonResponse
    {
        $user     = $request->user();
        $userRole = $user->getRoleNames()->first() ?? 'general_employee';
        $query    = ExceptionRequest::with(['employee:id,first_name,last_name,employee_code,department']);

        if (in_array($userRole, ['general_employee'])) {
            $query->where('employee_id', $user->employee_id);
        } elseif ($userRole === 'line_manager') {
            $managerEmployee = Employee::find($user->employee_id);
            $reportIds = $managerEmployee
                ? Employee::where('supervisor_id', $managerEmployee->id)->pluck('id')
                : collect();
            $query->whereIn('employee_id', $reportIds->push($user->employee_id));
        }

        if ($request->has('status'))      $query->where('status', $request->status);
        if ($request->has('employee_id')) $query->where('employee_id', $request->employee_id);

        return response()->json(['success' => true, 'data' => $query->orderByDesc('created_at')->paginate(15)]);
    }

    /** POST /api/exception-requests/{id}/manager-approve */
    public function managerApprove(Request $request, int $id): JsonResponse
    {
        $user     = $request->user();
        $userRole = $user->getRoleNames()->first();

        if (!in_array($userRole, ['line_manager', 'hr_manager', 'corporate_hr', 'executive'])) {
            return response()->json(['error' => 'INSUFFICIENT_PERMISSIONS'], 403);
        }

        $exceptionRequest = ExceptionRequest::find($id);
        if (!$exceptionRequest) return response()->json(['error' => 'NOT_FOUND'], 404);
        if ($exceptionRequest->status !== 'Pending') return response()->json(['error' => 'INVALID_STATUS'], 400);

        $exceptionRequest->update([
            'status'                => 'Approved by Manager',
            'line_manager_id'       => $user->id,
            'line_manager_notes'    => $request->input('notes'),
            'line_manager_acted_at' => now(),
        ]);

        // Escalate to HR Manager
        $hrManagers = User::role(['hr_manager', 'corporate_hr'])->get();
        $employee   = Employee::find($exceptionRequest->employee_id);
        $employeeName = $employee ? "{$employee->first_name} {$employee->last_name}" : "Employee";

        NotificationService::notifyMultiple(
            $hrManagers,
            'exception_request_escalated',
            "{$employeeName}'s {$exceptionRequest->request_type} request has been approved by their manager and requires your final approval",
            '/approvals/attendance',
            ['exception_request_id' => $exceptionRequest->id]
        );

        return response()->json(['success' => true, 'data' => $exceptionRequest->fresh()]);
    }

    /** POST /api/exception-requests/{id}/manager-reject */
    public function managerReject(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $exceptionRequest = ExceptionRequest::find($id);
        if (!$exceptionRequest) return response()->json(['error' => 'NOT_FOUND'], 404);

        $exceptionRequest->update([
            'status'                => 'Rejected',
            'line_manager_id'       => $user->id,
            'line_manager_notes'    => $request->input('notes'),
            'line_manager_acted_at' => now(),
        ]);

        $this->notifyEmployee($exceptionRequest, 'rejected', 'Your ' . $exceptionRequest->request_type . ' request was rejected by your manager');
        return response()->json(['success' => true, 'data' => $exceptionRequest->fresh()]);
    }

    /** POST /api/exception-requests/{id}/hr-approve */
    public function hrApprove(Request $request, int $id): JsonResponse
    {
        $user     = $request->user();
        $userRole = $user->getRoleNames()->first();

        if (!in_array($userRole, ['hr_manager', 'corporate_hr', 'executive'])) {
            return response()->json(['error' => 'INSUFFICIENT_PERMISSIONS'], 403);
        }

        $exceptionRequest = ExceptionRequest::find($id);
        if (!$exceptionRequest) return response()->json(['error' => 'NOT_FOUND'], 404);

        $exceptionRequest->update([
            'status'       => 'Approved',
            'hr_manager_id' => $user->id,
            'hr_notes'     => $request->input('notes'),
            'hr_acted_at'  => now(),
        ]);

        $this->notifyEmployee($exceptionRequest, 'approved', 'Your ' . $exceptionRequest->request_type . ' request has been approved');
        return response()->json(['success' => true, 'data' => $exceptionRequest->fresh()]);
    }

    /** POST /api/exception-requests/{id}/hr-reject */
    public function hrReject(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $exceptionRequest = ExceptionRequest::find($id);
        if (!$exceptionRequest) return response()->json(['error' => 'NOT_FOUND'], 404);

        $exceptionRequest->update([
            'status'       => 'Rejected',
            'hr_manager_id' => $user->id,
            'hr_notes'     => $request->input('notes'),
            'hr_acted_at'  => now(),
        ]);

        $this->notifyEmployee($exceptionRequest, 'rejected', 'Your ' . $exceptionRequest->request_type . ' request was rejected by HR');
        return response()->json(['success' => true, 'data' => $exceptionRequest->fresh()]);
    }

    private function notifyEmployee(ExceptionRequest $req, string $type, string $message): void
    {
        $employeeUser = User::where('employee_id', $req->employee_id)->first();
        if ($employeeUser) {
            NotificationService::notify($employeeUser, "exception_request_{$type}", $message, '/attendance', ['exception_request_id' => $req->id]);
        }
    }
}
