-- =============================================================================
-- EYE CLINIC - DATABASE FIX (CLEAN VERSION)
-- Run this script in Supabase SQL Editor
-- =============================================================================

-- 1. Create get_user_role function
-- =============================================================================
CREATE OR REPLACE FUNCTION get_user_role() RETURNS TEXT AS $$
SELECT COALESCE(p.role::text, 'frontdesk')
FROM public.profiles p
WHERE p.id = auth.uid()
LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- 2. Drop ALL existing policies
-- =============================================================================
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
            pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- 3. Enable RLS on all tables
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glasses_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glasses_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_others ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drug_dispensing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_dispensing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
-- =============================================================================

-- PROFILES
CREATE POLICY "view_profiles" ON public.profiles FOR SELECT TO authenticated
USING (TRUE);

CREATE POLICY "update_own_profile" ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "admin_manage_profiles" ON public.profiles FOR ALL TO authenticated
USING (get_user_role() IN ('admin', 'manager')) WITH CHECK (get_user_role() IN ('admin', 'manager'));

-- PATIENTS
CREATE POLICY "view_patients" ON public.patients FOR SELECT TO authenticated
USING (TRUE);

CREATE POLICY "manage_patients" ON public.patients FOR ALL TO authenticated
USING (get_user_role() IN ('frontdesk', 'admin')) WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));

-- APPOINTMENTS
CREATE POLICY "view_appointments" ON public.appointments FOR SELECT TO authenticated
USING (TRUE);

CREATE POLICY "doctor_appointments" ON public.appointments FOR ALL TO authenticated
USING (doctor_id = auth.uid()) WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "frontdesk_appointments" ON public.appointments FOR ALL TO authenticated
USING (get_user_role() IN ('frontdesk', 'admin')) WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));

-- DRUGS
CREATE POLICY "view_drugs" ON public.drugs FOR SELECT TO authenticated
USING (TRUE);

CREATE POLICY "manage_drugs" ON public.drugs FOR ALL TO authenticated
USING (get_user_role() IN ('frontdesk', 'admin')) WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));

-- GLASSES INVENTORY
CREATE POLICY "view_glasses" ON public.glasses_inventory FOR SELECT TO authenticated
USING (TRUE);

CREATE POLICY "manage_glasses" ON public.glasses_inventory FOR ALL TO authenticated
USING (get_user_role() IN ('frontdesk', 'admin')) WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));

-- GLASSES ORDERS
CREATE POLICY "view_orders" ON public.glasses_orders FOR SELECT TO authenticated
USING (TRUE);

CREATE POLICY "manage_orders" ON public.glasses_orders FOR ALL TO authenticated
USING (get_user_role() IN ('frontdesk', 'admin')) WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));

-- INVENTORY OTHERS
CREATE POLICY "view_inventory_others" ON public.inventory_others FOR SELECT TO authenticated
USING (TRUE);

CREATE POLICY "manage_inventory_others" ON public.inventory_others FOR ALL TO authenticated
USING (get_user_role() IN ('frontdesk', 'admin')) WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));

-- DRUG DISPENSING
CREATE POLICY "view_dispensing" ON public.drug_dispensing FOR SELECT TO authenticated
USING (get_user_role() IN ('doctor', 'frontdesk', 'admin'));

CREATE POLICY "create_dispensing" ON public.drug_dispensing FOR INSERT TO authenticated
WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));

-- INVENTORY DISPENSING
CREATE POLICY "view_inventory_dispensing" ON public.inventory_dispensing FOR SELECT TO authenticated
USING (TRUE);

CREATE POLICY "manage_inventory_dispensing" ON public.inventory_dispensing FOR ALL TO authenticated
USING (get_user_role() IN ('frontdesk', 'admin')) WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));

-- PRESCRIPTIONS
CREATE POLICY "view_prescriptions" ON public.prescriptions FOR SELECT TO authenticated
USING (TRUE);

CREATE POLICY "doctor_prescriptions" ON public.prescriptions FOR ALL TO authenticated
USING (doctor_id = auth.uid()) WITH CHECK (doctor_id = auth.uid());

-- CASE NOTES
CREATE POLICY "view_case_notes" ON public.case_notes FOR SELECT TO authenticated
USING (TRUE);

CREATE POLICY "doctor_case_notes" ON public.case_notes FOR ALL TO authenticated
USING (doctor_id = auth.uid()) WITH CHECK (doctor_id = auth.uid());

-- PAYMENTS
CREATE POLICY "view_payments" ON public.payments FOR SELECT TO authenticated
USING (get_user_role() IN ('frontdesk', 'admin', 'manager'));

CREATE POLICY "create_payments" ON public.payments FOR INSERT TO authenticated
WITH CHECK (get_user_role() IN ('frontdesk', 'admin', 'manager'));

CREATE POLICY "admin_payments" ON public.payments FOR ALL TO authenticated
USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');

-- MESSAGES (Fixed for chat to work properly)
CREATE POLICY "view_messages" ON public.messages FOR SELECT TO authenticated
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "send_messages" ON public.messages FOR INSERT TO authenticated
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "edit_own_messages" ON public.messages FOR UPDATE TO authenticated
USING (sender_id = auth.uid()) WITH CHECK (sender_id = auth.uid());

CREATE POLICY "delete_own_messages" ON public.messages FOR DELETE TO authenticated
USING (sender_id = auth.uid());

-- NOTIFICATIONS
CREATE POLICY "view_own_notifications" ON public.notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "update_own_notifications" ON public.notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "delete_own_notifications" ON public.notifications FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- AUDIT LOGS
CREATE POLICY "view_audit" ON public.audit_logs FOR SELECT TO authenticated
USING (get_user_role() IN ('admin', 'manager'));

-- OUTREACH LOG
CREATE POLICY "manage_outreach" ON public.outreach_log FOR ALL TO authenticated
USING (get_user_role() IN ('frontdesk', 'admin')) WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));

-- SETTINGS
CREATE POLICY "read_settings" ON public.settings FOR SELECT TO authenticated
USING (TRUE);

CREATE POLICY "admin_settings" ON public.settings FOR ALL TO authenticated
USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');

-- PUSH SUBSCRIPTIONS
CREATE POLICY "own_push_sub" ON public.push_subscriptions FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 5. Fix daily_summary table
-- =============================================================================
DO $$
DECLARE
    obj_kind "char";
BEGIN
    SELECT c.relkind INTO obj_kind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'daily_summary';

    IF obj_kind = 'v' THEN
        EXECUTE 'DROP VIEW public.daily_summary';
    ELSIF obj_kind = 'r' THEN
        EXECUTE 'DROP TABLE public.daily_summary CASCADE';
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.daily_summary (
    summary_date DATE PRIMARY KEY,
    new_patients INTEGER DEFAULT 0,
    returning_patients INTEGER DEFAULT 0,
    drug_revenue NUMERIC DEFAULT 0,
    glasses_revenue NUMERIC DEFAULT 0,
    consultation_revenue NUMERIC DEFAULT 0,
    subscription_revenue NUMERIC DEFAULT 0,
    total_revenue NUMERIC DEFAULT 0
);

-- 6. Fix audit trigger
-- =============================================================================
CREATE OR REPLACE FUNCTION public.audit_trigger_function() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (user_id, action, table_name, record_id)
        VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, OLD.id::TEXT);
    ELSE
        INSERT INTO public.audit_logs (user_id, action, table_name, record_id)
        VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id::TEXT);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create profiles for existing auth users
-- =============================================================================
INSERT INTO public.profiles (id, full_name, role, is_active)
SELECT
    u.id,
    COALESCE(u.raw_user_meta_data->>'first_name', 'User') || ' ' || COALESCE(u.raw_user_meta_data->>'last_name', ''),
    COALESCE(u.raw_user_meta_data->>'role', 'frontdesk'),
    true
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- 8. Create low_stock_drugs view with security_invoker
-- =============================================================================
DROP VIEW IF EXISTS public.low_stock_drugs CASCADE;
CREATE VIEW public.low_stock_drugs AS
SELECT d.*
FROM public.drugs d
WHERE d.quantity <= d.reorder_level
  AND d.quantity > 0
ORDER BY d.quantity ASC;

ALTER VIEW public.low_stock_drugs SET (security_invoker = true);

-- Done!
-- =============================================================================
-- After running this, go to Authentication > Settings in Supabase Dashboard
-- and DISABLE "Enable email confirmations" for staff creation
-- Also disable public sign-ups in Authentication > Settings
