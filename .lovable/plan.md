# Reliable office location and HRIS app icon

## What will change
- Keep the existing two-step Clock In flow: press Clock In, choose office or home, then confirm.
- For office clock-in, capture a high-accuracy reading and evaluate it against the employee's saved office location and radius.
- If the reading appears outside the office or is too imprecise, stop and explain that the office location could not be confirmed. Offer two guided retries asking the employee to move near a window or open area.
- On the third attempt, record the clock-in and explicitly request HR review instead of marking the employee absent.
- Keep permission-denied and unavailable-location failures blocked because no coordinates exist to review.
- Send GPS accuracy and attempt information with the clock-in so the backend audit can distinguish a verified reading from a third-attempt flagged reading.
- Replace the browser, Apple home-screen, Android/PWA, and maskable icons using the supplied workforce symbol on deep charcoal with an emerald accent and safe margins.
- Show the same icon in the install prompt, so install branding matches the downloaded app.

## Technical details
- Load office locations from `GET /attendance/office-locations`; normalize only documented location fields and match against the employee's assigned location.
- Use Haversine distance and an accuracy-aware boundary: the office radius plus the device's reported accuracy allowance.
- Keep retry state within the current clock-in attempt and reset it when mode changes, the flow is cancelled, or clock-in succeeds.
- Generate real PNG files at 64, 180, 192, and 512 pixels. Keep the workforce mark within the maskable safe zone.
- Update the manifest to provide separate `any` and `maskable` entries so launchers crop correctly.

## Validation
- Check first, second, and third attempt behavior, permission errors, WFH clock-in, cancel/reset, and successful clock-in.
- Confirm the manifest, favicon, Apple icon, 192px icon, and 512px icon all resolve and display the new artwork.
- Check the app at desktop and mobile widths and confirm the current build remains healthy.
