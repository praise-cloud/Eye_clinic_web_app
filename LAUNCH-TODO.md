# Eye Clinic Launch - Comprehensive Fix Plan

## Status
- Backend: port 3001 ✓
- DB RLS: Needs get_user_role() function

## Priority 1: DB & Auth (30min)
1. Run SQL: supabase/migrations/10-add-get_user_role.sql
2. Test login/register (no hang)
3. Test logout button

## Priority 2: Role Permissions (1h)
- Patient delete (frontdesk)
- Staff CRUD (manager/admin)
- Doctor case notes + Rx/glasses

## Priority 3: Features (2h)
- Calendar display
- Notifications realtime
- Outreach messaging
- Appointment booking form

## Priority 4: UX (30min)
- Back button → login
- Tab navigation bugs
- Loading hangs/pauses

**Next:** Confirm SQL run + login test result.
