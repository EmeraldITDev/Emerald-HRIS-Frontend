<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('late_clockin_requests', function (Blueprint $table) {
            // Add line manager first-level approval tier
            $table->unsignedBigInteger('line_manager_user_id')->nullable()->after('employee_id');
            $table->foreign('line_manager_user_id')->references('id')->on('users')->nullOnDelete();
            $table->string('line_manager_status')->default('Pending')->after('line_manager_user_id')
                  ->comment('Pending | Approved | Rejected');
            $table->text('line_manager_notes')->nullable()->after('line_manager_status');
            $table->timestamp('line_manager_acted_at')->nullable()->after('line_manager_notes');
            // Rename existing approver fields to clarify they are HR-level
            // existing: approver_user_id, approver_notes, decided_at — these become the HR tier
            // Add hr_ prefixed aliases for clarity (keep originals for backward compat)
        });
    }

    public function down(): void
    {
        Schema::table('late_clockin_requests', function (Blueprint $table) {
            $table->dropForeign(['line_manager_user_id']);
            $table->dropColumn(['line_manager_user_id', 'line_manager_status', 'line_manager_notes', 'line_manager_acted_at']);
        });
    }
};
