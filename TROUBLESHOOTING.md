# Eye Clinic PWA — Troubleshooting Guide

This document helps diagnose and fix common issues with the Eye Clinic PWA.

---

## Quick Fix (Run This First)

If you're experiencing multiple issues, run the complete schema in Supabase SQL Editor:

```sql
-- Run the entire supabase/schema.sql script
-- This creates: all tables, RLS policies, triggers, functions
```

---

## Issue: "Login Not Working"

### Symptoms
- Can't sign in after registering
- Error: "Invalid login credentials" even with correct password
- Page stuck on loading after login

### Causes & Fixes

**1. handle_new_user trigger missing (most common)**
```
Error: No profile found for user
```
The trigger should auto-create profile on signup. Verify in Supabase:
```sql
SELECT * FROM pg_triggers WHERE tgname = 'on_auth_user_created';
```

**2. Profile not created due to RLS**
```sql
-- Check profiles table RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (true);
```

**3. Invalid email/password**
- Verify email is correct
- Reset password via Supabase dashboard: Authentication → Users → Reset password

---

## Issue: "Can't Create frontdesk or manager Accounts"

### Symptoms
- Registration fails for these roles
- Role dropdown only shows old roles

### Cause
profiles table CHECK constraint has old roles.

### Fix
```sql
-- Drop old constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new constraint with 4 roles
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('doctor','frontdesk','admin','manager'));
```

---

## Issue: "Appointments Not Saving"

### Symptoms
- Create appointment form submits but doesn't appear in list
- Error or no feedback after save

### Causes & Fixes

**1. RLS blocking insert**
```sql
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "appointments_insert" ON public.appointments;
CREATE POLICY "appointments_insert" ON public.appointments
  FOR INSERT WITH CHECK (true);
```

**2. Foreign key constraint (patient_id or doctor_id invalid)**
- Ensure patient exists
- Ensure doctor_id references a valid profile with role='doctor'

**3. No scheduled_at value**
- Ensure scheduled_at is set to a valid timestamp

---

## Issue: "Messages Not Notifying"

### Symptoms
- Send message but recipient doesn't get toast notification
- Real-time updates not working

### Causes & Fixes

**1. Realtime not enabled for messages table**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
```

**2. Browser notifications blocked**
- Check browser settings
- Ensure app is running over HTTPS (required for notifications)

---

## Issue: "Activity Feed Empty"

### Symptoms
- Admin dashboard shows no recent activity
- Manager audit page shows no logs

### Cause
audit_logs table exists but triggers may not be applied, or RLS policy blocks manager access.

### Fix
The schema.sql now includes audit triggers. Run it in Supabase SQL Editor, then verify:
```sql
-- Check audit_logs table exists
SELECT COUNT(*) FROM public.audit_logs;

-- Check triggers exist
SELECT * FROM pg_trigger WHERE tgname LIKE 'audit_%';

-- Check manager can read audit logs (run as manager)
SELECT get_user_role(); -- should return 'manager'
SELECT COUNT(*) FROM public.audit_logs;
```

If triggers are missing, re-run the audit trigger section from schema.sql:
```sql
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
  VALUES (
    auth.uid(), TG_OP, TG_TABLE_NAME,
    CASE TG_OP WHEN 'DELETE' THEN OLD.id ELSE NEW.id END,
    CASE TG_OP WHEN 'INSERT' THEN NULL ELSE row_to_json(OLD)::jsonb END,
    CASE TG_OP WHEN 'DELETE' THEN NULL ELSE row_to_json(NEW)::jsonb END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to tables
CREATE TRIGGER audit_patients AFTER INSERT OR UPDATE OR DELETE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
CREATE TRIGGER audit_payments AFTER INSERT OR UPDATE OR DELETE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
CREATE TRIGGER audit_drug_dispensing AFTER INSERT OR UPDATE OR DELETE ON public.drug_dispensing FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
CREATE TRIGGER audit_case_notes AFTER INSERT OR UPDATE OR DELETE ON public.case_notes FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
CREATE TRIGGER audit_glasses_orders AFTER INSERT OR UPDATE OR DELETE ON public.glasses_orders FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
```

---

## Issue: "Notifications Error / Settings Missing"

### Symptoms
- Toast shows "settings table missing"
- Error in console about settings

### Cause
settings table doesn't exist or missing default data.

### Fix
```sql
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

INSERT INTO public.settings (key, value) VALUES
    ('clinic_name', 'KORENE Eye Clinic'),
    ('clinic_email', 'contact@korene.com'),
    ('clinic_phone', '+234'),
    ('clinic_address', '')
ON CONFLICT (key) DO NOTHING;
```

---

## Issue: "PWA Not Installing"

### Symptoms
- "Add to Home Screen" not available
- Install button missing

### Causes & Fixes

**1. Not served over HTTPS**
- PWA requires HTTPS (or localhost for dev)
- Deploy to Vercel (automatic HTTPS)

**2. PWA manifest missing**
- Check `client/public/manifest.json` exists
- Check `vite-plugin-pwa` config in vite.config.ts

**3. Missing icons**
- Ensure icons exist in `client/public/icons/`
- Required: icon-192.png, icon-512.png, logo.png

---

## Database Schema Reference

### Tables (created by schema.sql)
- `profiles` — staff accounts (id, full_name, role, phone, is_active)
- `patients` — patient records
- `appointments` — appointment schedules
- `case_notes` — clinical notes (doctor only)
- `prescriptions` — glasses prescriptions
- `drugs` — pharmacy inventory
- `drug_dispensing` — drug dispensing records
- `glasses_inventory` — frames inventory
- `glasses_orders` — glasses orders
- `payments` — payment records
- `messages` — internal chat
- `audit_logs` — activity audit trail
- `settings` — clinic config
- `outreach_log` — SMS/email outreach

### Roles (4 only)
- `frontdesk` — patient registration, appointments, dispensing
- `doctor` — patients, case notes, prescriptions
- `admin` — full access
- `manager` — audit logs, reports, staff management

### Key Functions
- `get_user_role()` — returns current user's role
- `handle_new_user()` — auto-creates profile on signup
- `generate_patient_number()` — auto-generates P-00001
- `generate_order_number()` — auto-generates GO-00001
- `generate_receipt_number()` — auto-generates RCP-00001
- `reduce_drug_stock()` — auto-reduces drug stock on dispense

### Key Triggers
- `on_auth_user_created` — auto-creates profile on signup
- `set_patient_number` — auto-generates patient number
- `set_order_number` — auto-generates glasses order number
- `set_receipt_number` — auto-generates receipt number
- `on_drug_dispensed` — auto-reduces drug stock on dispense
- `audit_patients` — logs patient changes to audit_logs
- `audit_payments` — logs payment changes to audit_logs
- `audit_drug_dispensing` — logs dispensing changes to audit_logs
- `audit_case_notes` — logs case note changes to audit_logs
- `audit_glasses_orders` — logs glasses order changes to audit_logs

---

## Getting Help

1. **Check browser console** (F12) for errors
2. **Check Supabase dashboard** for:
   - Table Data tab for missing records
   - Logs for errors
   - Authentication for failed logins
3. **Run schema.sql** to apply all tables and policies
4. For additional issues, check route components in `src/pages/`

---

## After Running schema.sql

1. Deploy updated app to Vercel
2. Clear browser localStorage (optional)
3. Log in again
4. Test creating new staff with frontdesk/manager role
