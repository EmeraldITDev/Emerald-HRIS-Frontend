<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WfhRequest extends Model
{
    protected $fillable = [
        'employee_id', 'request_date', 'reason',
        'status', 'approved_by', 'approved_at', 'approver_notes',
    ];

    protected $casts = [
        'request_date' => 'date',
        'approved_at'  => 'datetime',
    ];

    public function employee() { return $this->belongsTo(Employee::class); }
    public function approver() { return $this->belongsTo(User::class, 'approved_by'); }
}
