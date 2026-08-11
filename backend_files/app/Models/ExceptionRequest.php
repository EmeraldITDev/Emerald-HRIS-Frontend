<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExceptionRequest extends Model
{
    protected $fillable = [
        'employee_id', 'request_type', 'start_date', 'end_date',
        'description', 'document_path', 'status',
        'line_manager_id', 'line_manager_notes', 'line_manager_acted_at',
        'hr_manager_id', 'hr_notes', 'hr_acted_at',
    ];

    protected $casts = [
        'start_date'            => 'date',
        'end_date'              => 'date',
        'line_manager_acted_at' => 'datetime',
        'hr_acted_at'           => 'datetime',
    ];

    public function employee()      { return $this->belongsTo(Employee::class); }
    public function lineManager()   { return $this->belongsTo(User::class, 'line_manager_id'); }
    public function hrManager()     { return $this->belongsTo(User::class, 'hr_manager_id'); }
}
