<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            // Add work arrangement — controls attendance rules per employee
            $table->string('work_arrangement')->nullable()
                  ->comment('Hybrid | Fully Onsite | Fully Remote');
            
            // Add assigned location as controlled field alongside existing work_location
            $table->string('assigned_location')->nullable()
                  ->comment('Lagos | Calabar | Abuja');
            
            // Add supervisor_id for hierarchy-based routing
            $table->unsignedBigInteger('supervisor_id')->nullable();
            $table->foreign('supervisor_id')->references('id')->on('employees')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropForeign(['supervisor_id']);
            $table->dropColumn(['work_arrangement', 'assigned_location', 'supervisor_id']);
        });
    }
};
