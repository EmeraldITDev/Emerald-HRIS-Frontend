<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('attendance_schedules', function (Blueprint $table) {
            $table->id();
            $table->string('location')->comment('Lagos | Calabar | Abuja');
            $table->string('day_of_week')->comment('Monday | Tuesday | Wednesday | Thursday | Friday');
            $table->string('expected_mode')->comment('Physical | WFH');
            $table->time('clock_in_time')->default('09:00:00');
            $table->time('clock_out_time')->default('17:00:00');
            $table->timestamps();
            $table->unique(['location', 'day_of_week']);
        });

        // Seed Emerald's standard schedules
        DB::table('attendance_schedules')->insert([
            // Lagos — Hybrid
            ['location' => 'Lagos', 'day_of_week' => 'Monday',    'expected_mode' => 'Physical', 'clock_in_time' => '09:00:00', 'clock_out_time' => '17:00:00', 'created_at' => now(), 'updated_at' => now()],
            ['location' => 'Lagos', 'day_of_week' => 'Tuesday',   'expected_mode' => 'WFH',      'clock_in_time' => '09:00:00', 'clock_out_time' => '17:00:00', 'created_at' => now(), 'updated_at' => now()],
            ['location' => 'Lagos', 'day_of_week' => 'Wednesday', 'expected_mode' => 'Physical', 'clock_in_time' => '09:00:00', 'clock_out_time' => '17:00:00', 'created_at' => now(), 'updated_at' => now()],
            ['location' => 'Lagos', 'day_of_week' => 'Thursday',  'expected_mode' => 'Physical', 'clock_in_time' => '09:00:00', 'clock_out_time' => '17:00:00', 'created_at' => now(), 'updated_at' => now()],
            ['location' => 'Lagos', 'day_of_week' => 'Friday',    'expected_mode' => 'WFH',      'clock_in_time' => '09:00:00', 'clock_out_time' => '17:00:00', 'created_at' => now(), 'updated_at' => now()],
            // Calabar — Fully Onsite
            ['location' => 'Calabar', 'day_of_week' => 'Monday',    'expected_mode' => 'Physical', 'clock_in_time' => '09:00:00', 'clock_out_time' => '17:00:00', 'created_at' => now(), 'updated_at' => now()],
            ['location' => 'Calabar', 'day_of_week' => 'Tuesday',   'expected_mode' => 'Physical', 'clock_in_time' => '09:00:00', 'clock_out_time' => '17:00:00', 'created_at' => now(), 'updated_at' => now()],
            ['location' => 'Calabar', 'day_of_week' => 'Wednesday', 'expected_mode' => 'Physical', 'clock_in_time' => '09:00:00', 'clock_out_time' => '17:00:00', 'created_at' => now(), 'updated_at' => now()],
            ['location' => 'Calabar', 'day_of_week' => 'Thursday',  'expected_mode' => 'Physical', 'clock_in_time' => '09:00:00', 'clock_out_time' => '17:00:00', 'created_at' => now(), 'updated_at' => now()],
            ['location' => 'Calabar', 'day_of_week' => 'Friday',    'expected_mode' => 'Physical', 'clock_in_time' => '09:00:00', 'clock_out_time' => '17:00:00', 'created_at' => now(), 'updated_at' => now()],
            // Abuja — Fully Remote
            ['location' => 'Abuja', 'day_of_week' => 'Monday',    'expected_mode' => 'WFH', 'clock_in_time' => '09:00:00', 'clock_out_time' => '17:00:00', 'created_at' => now(), 'updated_at' => now()],
            ['location' => 'Abuja', 'day_of_week' => 'Tuesday',   'expected_mode' => 'WFH', 'clock_in_time' => '09:00:00', 'clock_out_time' => '17:00:00', 'created_at' => now(), 'updated_at' => now()],
            ['location' => 'Abuja', 'day_of_week' => 'Wednesday', 'expected_mode' => 'WFH', 'clock_in_time' => '09:00:00', 'clock_out_time' => '17:00:00', 'created_at' => now(), 'updated_at' => now()],
            ['location' => 'Abuja', 'day_of_week' => 'Thursday',  'expected_mode' => 'WFH', 'clock_in_time' => '09:00:00', 'clock_out_time' => '17:00:00', 'created_at' => now(), 'updated_at' => now()],
            ['location' => 'Abuja', 'day_of_week' => 'Friday',    'expected_mode' => 'WFH', 'clock_in_time' => '09:00:00', 'clock_out_time' => '17:00:00', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_schedules');
    }
};
