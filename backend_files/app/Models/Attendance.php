<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    use HasFactory;

    protected $table = 'attendance';

    protected $fillable = [
        'employee_id',
        'date',
        'clock_in',
        'clock_out',
        'break_start',
        'break_end',
        'total_hours',
        'break_duration',
        'status',
        'notes',
        'location',
        // New fields
        'work_mode',
        'expected_mode',
        'location_lat',
        'location_lng',
        'location_verified',
        'location_status',
        'justification_status',
    ];

    protected $casts = [
        'date'             => 'date',
        'clock_in'         => 'datetime',
        'clock_out'        => 'datetime',
        'break_start'      => 'datetime',
        'break_end'        => 'datetime',
        'break_duration'   => 'integer',
        'location_verified' => 'boolean',
        'location_lat'     => 'decimal:8',
        'location_lng'     => 'decimal:8',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * DB stores whole minutes; API consumers expect decimal hours.
     */
    protected function totalHours(): Attribute
    {
        return Attribute::make(
            get: fn (?int $value) => $value !== null ? round($value / 60, 2) : null,
        );
    }

    /**
     * Haversine distance in metres between two GPS coordinates.
     */
    public static function haversineDistance(
        float $lat1, float $lng1,
        float $lat2, float $lng2
    ): float {
        $earthRadius = 6371000; // metres
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;
        return $earthRadius * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

    /**
     * Emerald office GPS coordinates and geofence radius.
     */
    public static function officeCoordinates(): array
    {
        return [
            'Lagos'   => ['lat' => 6.4281,  'lng' => 3.4219,  'radius' => 200],
            'Calabar' => ['lat' => 4.9517,  'lng' => 8.3220,  'radius' => 200],
        ];
    }

    /**
     * Check if given coordinates are within the office geofence.
     * Returns ['verified' => bool, 'status' => string, 'distance' => float]
     */
    public static function checkGeofence(string $location, float $lat, float $lng): array
    {
        $offices = self::officeCoordinates();

        if (!isset($offices[$location])) {
            // Abuja or unknown — remote, exempt from check
            return ['verified' => true, 'status' => 'Exempt', 'distance' => 0];
        }

        $office  = $offices[$location];
        $distance = self::haversineDistance($lat, $lng, $office['lat'], $office['lng']);
        $verified = $distance <= $office['radius'];

        return [
            'verified' => $verified,
            'status'   => $verified ? 'Verified' : 'Mismatch',
            'distance' => round($distance, 1),
        ];
    }
}
