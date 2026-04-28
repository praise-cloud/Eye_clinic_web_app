# Appointment Bug Fix — TODO

## Plan
Fix schema mismatch where backend/api uses `appointment_date`/`appointment_time` but DB schema defines `scheduled_at`. Also mount missing backend routers and add frontend error handling.

## Steps

1. [x] Fix `backend/src/routes/appointments.js` — replace `appointment_date`/`appointment_time` with `scheduled_at`, fix status default
2. [x] Fix `backend/src/routes/dashboard.js` — replace `appointment_date` with `scheduled_at`
3. [x] Fix `backend/src/index.js` — mount all missing routers
4. [x] Fix `src/lib/api.ts` — replace `appointment_date`/`appointment_time` with `scheduled_at`
5. [x] Fix `src/pages/appointments/CalendarPage.tsx` — fix statusColors/statusBg keys (`scheduled` → `pending`)
6. [x] Fix `src/pages/appointments/AppointmentsPage.tsx` — add error handling to useQuery
7. [x] Fix `src/pages/patients/PatientDetailPage.tsx` — add error handling to useQuery
