<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('exception_requests', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employee_id');
            $table->foreign('employee_id')->references('id')->on('employees')->cascadeOnDelete();
            $table->string('request_type')
                  ->comment('Official Duty | Business Travel | Training | Site Assignment | Client Assignment | Temporary Location | Other');
            $table->date('start_date');
            $table->date('end_date');
            $table->text('description')->nullable();
            $table->string('document_path')->nullable();
            $table->string('status')->default('Pending')
                  ->comment('Pending | Approved by Manager | Approved | Rejected');
            $table->unsignedBigInteger('line_manager_id')->nullable();
            $table->foreign('line_manager_id')->references('id')->on('users')->nullOnDelete();
            $table->text('line_manager_notes')->nullable();
            $table->timestamp('line_manager_acted_at')->nullable();
            $table->unsignedBigInteger('hr_manager_id')->nullable();
            $table->foreign('hr_manager_id')->references('id')->on('users')->nullOnDelete();
            $table->text('hr_notes')->nullable();
            $table->timestamp('hr_acted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exception_requests');
    }
};
