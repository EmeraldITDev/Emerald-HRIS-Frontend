<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('attendance', function (Blueprint $table) {
            // Work mode actually recorded
            $table->string('work_mode')->nullable()
                  ->comment('Physical | WFH | Official Duty | Business Travel | Training | Site Assignment | Client Assignment | Other');
            
            // What the system expected based on schedule
            $table->string('expected_mode')->nullable()
                  ->comment('Physical | WFH');
            
            // GPS coordinates captured at clock-in
            $table->decimal('location_lat', 10, 8)->nullable();
            $table->decimal('location_lng', 11, 8)->nullable();
            
            // Location verification result
            $table->boolean('location_verified')->default(false);
            $table->string('location_status')->nullable()
                  ->comment('Verified | Mismatch | Exempt | Not Required');
            
            // Justification request status on this record
            $table->string('justification_status')->default('None')
                  ->comment('None | Pending | Approved | Rejected');
        });
    }

    public function down(): void
    {
        Schema::table('attendance', function (Blueprint $table) {
            $table->dropColumn([
                'work_mode', 'expected_mode', 'location_lat', 'location_lng',
                'location_verified', 'location_status', 'justification_status'
            ]);
        });
    }
};
