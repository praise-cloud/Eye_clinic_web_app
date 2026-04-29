# Audit Log Fix - Progress Tracker

## Tasks
- [x] Add audit trigger function to `supabase/schema.sql`
- [x] Add audit triggers to key tables in `supabase/schema.sql`
- [x] Add Manager RLS policy for audit_logs in `supabase/schema.sql`
- [x] Update `TROUBLESHOOTING.md` to remove audit_logs issue
- [x] Verify all changes are correct

## Tables with Audit Triggers
- [x] patients
- [x] payments
- [x] drug_dispensing
- [x] case_notes
- [x] glasses_orders

## Admin Dashboard Cleanup
- [x] Remove appointments section from `AdminDashboard.tsx`
- [x] Remove staff section from `AdminDashboard.tsx`
- [x] Remove inventory section from `AdminDashboard.tsx`
- [x] Remove appointments, inventory, staff from `Sidebar.tsx` admin nav
- [x] Remove appointments, inventory, staff from `Header.tsx` breadcrumbs
- [x] Remove inventory, staff from `BottomNav.tsx` admin nav

## Summary of Changes

### `supabase/schema.sql`
1. Added `audit_trigger_function()` — captures auth.uid(), action type, old/new data as JSONB
2. Added 5 audit triggers:
   - `audit_patients` on `patients`
   - `audit_payments` on `payments`
   - `audit_drug_dispensing` on `drug_dispensing`
   - `audit_case_notes` on `case_notes`
   - `audit_glasses_orders` on `glasses_orders`
3. Updated RLS policy from `Admin views audit` (admin-only) to `Admin and manager view audit` (admin + manager)

### `TROUBLESHOOTING.md`
- Updated "Activity Feed Empty" section with new troubleshooting steps
- Added audit triggers to Key Triggers reference list

### Admin Dashboard Cleanup
- `src/pages/admin/AdminDashboard.tsx` — Removed appointments query, staff stats, inventory stats, and "Today's Appointments" section. Dashboard now shows: Total Patients, Today's Revenue, Today's Glasses, Mini Calendar, Activity Feed.
- `src/components/layout/Sidebar.tsx` — Removed Appointments, Inventory, Staff from admin sidebar. Admin nav now: Dashboard, Patients, Calendar, Reports, Payments, Messages, Settings.
- `src/components/layout/Header.tsx` — Removed breadcrumb entries for /admin/inventory, /admin/users, /admin/appointments.
- `src/components/layout/BottomNav.tsx` — Removed Inventory, Staff from admin bottom nav. Admin nav now: Home, Patients, Chat.

## Next Steps (User Action Required)
1. Run the updated `schema.sql` in Supabase SQL Editor
2. Test by creating a patient as manager → check audit log appears
3. Navigate to `/manager/audit` → should now show logs
