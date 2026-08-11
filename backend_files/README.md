# Attendance v2 — Backend files to upload

Generated to mirror the real Laravel backend layout. Upload each file to the
matching path on Render (`/var/www/html/...`), then run migrations.

| Local file | Server path | Action |
| --- | --- | --- |
| `app/Http/Controllers/AttendanceController.php` | `app/Http/Controllers/AttendanceController.php` | REPLACE (existing methods preserved, clock-in rules updated, v2 methods appended) |
| `app/Http/Controllers/ExceptionRequestController.php` | same | NEW |
| `app/Http/Controllers/WfhRequestController.php` | same | NEW |
| `app/Models/Attendance.php` | `app/Models/Attendance.php` | REPLACE |
| `app/Models/Employee.php` | `app/Models/Employee.php` | REPLACE |
| `app/Models/ExceptionRequest.php` / `WfhRequest.php` / `MissingClockoutRequest.php` | `app/Models/` | NEW |
| `database/migrations/2026_08_11_0000*.php` | `database/migrations/` | NEW (7 files) |
| `routes/attendance_routes.php` | merge into `routes/api-routes.php` | MERGE |

## Steps

1. Upload the models, controllers and migrations.
2. Merge `routes/attendance_routes.php` into `routes/api-routes.php` — copy the
   `use` statements to the top and the route lines into the existing
   `auth:sanctum` group (do not double-register the sanctum group).
3. `php artisan migrate`
4. `php artisan config:clear && php artisan route:clear && php artisan cache:clear`
5. Verify: `php artisan route:list --path=attendance`

## Notes / manual checks

- **`LateClockInRequest` model**: add `line_manager_user_id`, `line_manager_status`,
  `line_manager_notes`, `line_manager_acted_at` to `$fillable`, and allow
  `manager_approved` in any status enum/check constraint.
- **`attendance.status`**: the controller now writes `Present-Physical`,
  `Present-WFH`, `Late`, `Unapproved-WFH`. If the column has a CHECK constraint
  or enum, widen it before deploying, otherwise clock-in will fail.
- **Geofence coordinates** in `Attendance::officeCoordinates()` are placeholders
  for Lagos and Calabar (200 m radius) — replace with the real office GPS.
- **Exception documents** are stored on the `s3` disk (same as employee docs).
- Endpoints added beyond the original brief because the frontend calls them:
  `GET /attendance/today`, `POST /attendance/break-start|break-end` (aliases to
  the existing lunch handlers), the missing-clock-out request/list/approve/reject
  set, and the line-manager tier for late clock-in requests.
