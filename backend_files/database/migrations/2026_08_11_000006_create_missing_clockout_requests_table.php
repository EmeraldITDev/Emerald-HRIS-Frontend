<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('missing_clockout_requests', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employee_id');
            $table->foreign('employee_id')->references('id')->on('employees')->cascadeOnDelete();
            $table->date('attendance_date');
            $table->time('claimed_clock_out_time');
            $table->text('reason');
            $table->string('status')->default('Pending')
                  ->comment('Pending | Approved | Rejected');
            $table->unsignedBigInteger('approver_user_id')->nullable();
            $table->foreign('approver_user_id')->references('id')->on('users')->nullOnDelete();
            $table->text('approver_notes')->nullable();
            $table->timestamp('decided_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('missing_clockout_requests');
    }
};
