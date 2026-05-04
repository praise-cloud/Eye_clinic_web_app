# Eye Clinic Fix Prompts - Targeted Issues

## 1. Login Hanging (5min)
**Files:** LoginPage.tsx, App.tsx
**Prompt:** "Optimize login profile fetch with timeout/retry. Add loading skeleton. Fix RLS dependency on get_user_role()"

## 2. Logout Broken (3min)
**Files:** Header.tsx, useAuth.ts
**Prompt:** "Fix logout: supabase.auth.signOut() + store.clear + window.location.href = '/login'. Test all nav logout buttons"

## 3. Browser Back → Dashboard (5min)
**Files:** App.tsx
**Prompt:** "Add browser back protection: useEffect history listener + confirm/redirect login if !authenticated"

## 4. Appointment Booking Fails (10min)
**Files:** AppointmentsPage.tsx, appointments RLS
**Prompt:** "Fix appointment insert: check form validation, RLS WITH CHECK(true), backend proxy fallback"

## 5. Patient Delete Fails (5min)
**Files:** PatientsPage.tsx, patients RLS
**Prompt:** "Enable frontdesk/admin patient delete: RLS DELETE USING IN('frontdesk','admin')"

## 6. Manager Staff CRUD (15min)
**Files:** UsersPage.tsx, profiles RLS
**Prompt:** "Manager create/delete staff: RLS manager_manage policy + form validation"

## 7. Case Notes + Prescriptions (15min)
**Files:** CaseNotesPage.tsx, PrescriptionsPage.tsx
**Prompt:** "Link case notes → add Rx/glasses: nested forms + relations"

## 8. Calendar Not Showing (10min)
**Files:** CalendarPage.tsx
**Prompt:** "Fix calendar: verify appointments query + date filtering"

## 9. Notifications Realtime (10min)
**Files:** useRealtimeNotifications.ts, notificationStore.ts
**Prompt:** "Realtime + persist unread: supabase channel + localStorage sync"

## 10. Outreach SMS/Email (20min)
**Files:** OutreachPage.tsx
**Prompt:** "Impl patient outreach: Twilio/Resend API + appointment reminders"

**Start with #1-3?** Confirm SQL run first.
