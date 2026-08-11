<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class Employee extends Model
{
    protected $fillable = [
        'first_name', 'middle_name', 'last_name', 'dob', 'gender',
        'marital_status', 'nationality', 'phone', 'email', 'address',
        'emergency_contact_name', 'emergency_contact_number',
        'next_of_kin_name', 'next_of_kin_relationship',
        'next_of_kin_phone', 'next_of_kin_email', 'next_of_kin_address',
        'profile_picture', 'job_title', 'department', 'employment_type',
        'grade_level', 'supervisor_name', 'work_location', 'hire_date',
        'probation_period', 'confirmation_date', 'employment_status',
        'vacation_days', 'employee_code', 'profile_incomplete',
        // New attendance fields
        'work_arrangement',   // Hybrid | Fully Onsite | Fully Remote
        'assigned_location',  // Lagos | Calabar | Abuja
        'supervisor_id',      // FK to employees.id
    ];

    protected $casts = [
        'dob' => 'date',
    ];

    protected static function booted()
    {
        static::addGlobalScope('exclude_dummy_users', function (Builder $builder) {
            $builder->where('email', 'NOT LIKE', '%@example.com');
        });
    }

    // Existing relationships
    public function financialDetails()  { return $this->hasOne(FinancialDetail::class); }
    public function governmentIds()     { return $this->hasOne(GovernmentId::class); }
    public function additionalData()    { return $this->hasOne(AdditionalData::class); }
    public function payrollRecords()    { return $this->hasMany(PayrollRecord::class); }
    public function documents()         { return $this->hasMany(EmployeeDocument::class); }
    public function user()              { return $this->hasOne(User::class, 'employee_id'); }

    // New attendance relationships
    public function supervisor()
    {
        return $this->belongsTo(Employee::class, 'supervisor_id');
    }

    public function directReports()
    {
        return $this->hasMany(Employee::class, 'supervisor_id');
    }

    public function attendanceRecords()
    {
        return $this->hasMany(Attendance::class);
    }

    /**
     * Get today's expected attendance schedule for this employee.
     * Returns array with expected_mode, clock_in_time, clock_out_time
     */
    public function getTodaySchedule(): array
    {
        $location  = $this->assigned_location ?? $this->work_location ?? 'Lagos';
        $dayOfWeek = now('Africa/Lagos')->format('l'); // Monday, Tuesday, etc.

        $schedule = \DB::table('attendance_schedules')
            ->where('location', $location)
            ->where('day_of_week', $dayOfWeek)
            ->first();

        if ($schedule) {
            return [
                'expected_mode'  => $schedule->expected_mode,
                'clock_in_time'  => $schedule->clock_in_time,
                'clock_out_time' => $schedule->clock_out_time,
                'location'       => $location,
                'day_of_week'    => $dayOfWeek,
            ];
        }

        // Fallback defaults
        return [
            'expected_mode'  => 'Physical',
            'clock_in_time'  => '09:00:00',
            'clock_out_time' => '17:00:00',
            'location'       => $location,
            'day_of_week'    => $dayOfWeek,
        ];
    }

    public function resolveGrossSalary(): float
    {
        $this->loadMissing('financialDetails');
        return (float) ($this->financialDetails?->gross_salary ?? 0);
    }

    public static function resolveByIdOrCode(string|int $identifier): ?self
    {
        $key = trim((string) $identifier);
        if ($key === '') return null;
        if (ctype_digit($key)) return static::query()->find((int) $key);

        $employee = static::query()
            ->whereRaw('LOWER(employee_code) = ?', [strtolower($key)])
            ->first();
        if ($employee) return $employee;

        return static::query()
            ->whereHas('governmentIds', function ($q) use ($key) {
                $q->whereRaw('LOWER(employee_id_code) = ?', [strtolower($key)]);
            })
            ->first();
    }
}
