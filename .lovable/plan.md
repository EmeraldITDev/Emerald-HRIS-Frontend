# Fix work-from-home clock-in

## Changes
- Send a minimal WFH clock-in request containing the employee, date, and `work_mode: WFH`; do not send client-authored location exemption or verification flags.
- Update the attendance controller source so coordinates are required only for Physical clock-ins and WFH exemption status is derived by the server.
- Keep GPS capture and location review behavior unchanged for office clock-ins.
- Update the attendance documentation to match the corrected behavior.

## Verification
- Check the request payload for both WFH and Physical modes.
- Run the relevant checks and confirm the preview remains error-free.
- The deployed backend must include the controller change before production WFH clock-ins can succeed.
