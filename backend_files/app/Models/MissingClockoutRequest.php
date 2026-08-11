<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MissingClockoutRequest extends Model
{
    protected $fillable = [
        'employee_id', 'attendance_date', 'claimed_clock_out_time',
        'reason', 'status', 'approver_user_id', 'approver_notes', 'decided_at',
    ];

    protected $casts = [
        'attendance_date' => 'date',
        'decided_at'      => 'datetime',
    ];

    public function employee() { return $this->belongsTo(Employee::class); }
    public function approver() { return $this->belongsTo(User::class, 'approver_user_id'); }
}
