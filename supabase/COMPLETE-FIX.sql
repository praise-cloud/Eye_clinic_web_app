-- ============================================================================
-- DATABASE FIX - Run in Supabase SQL Editor
-- ============================================================================
-- Create get_user_role function if missing
CREATE OR REPLACE FUNCTION get_user_role() RETURNS text AS $$
SELECT COALESCE(p.role::text, 'admin')
FROM public.profiles p
WHERE p.id = auth.uid()
LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
-- ============================================================================
-- DROP ALL RESTRICTIVE POLICIES
-- ============================================================================
-- Profiles
DROP POLICY IF EXISTS "all_manage_profiles" ON public.profiles;
DROP POLICY IF EXISTS "All view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Manager manage profiles" ON public.profiles;
-- Patients
DROP POLICY IF EXISTS "all_manage_patients" ON public.patients;
DROP POLICY IF EXISTS "All view patients" ON public.patients;
DROP POLICY IF EXISTS "Frontdesk/admin manage patients" ON public.patients;
-- Appointments
DROP POLICY IF EXISTS "all_manage_appointments" ON public.appointments;
DROP POLICY IF EXISTS "All view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctor manages own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Frontdesk/admin manage appointments" ON public.appointments;
-- Case Notes
DROP POLICY IF EXISTS "all_manage_case_notes" ON public.case_notes;
-- Prescriptions
DROP POLICY IF EXISTS "all_manage_prescriptions" ON public.prescriptions;
-- Drugs
DROP POLICY IF EXISTS "all_manage_drugs" ON public.drugs;
DROP POLICY IF EXISTS "All staff view drugs" ON public.drugs;
DROP POLICY IF EXISTS "Frontdesk/admin manage drugs" ON public.drugs;
-- Drugs Dispensing
DROP POLICY IF EXISTS "all_manage_drug_dispensing" ON public.drug_dispensing;
DROP POLICY IF EXISTS "View dispensing" ON public.drug_dispensing;
DROP POLICY IF EXISTS "Frontdesk/admin dispenses" ON public.drug_dispensing;
-- Glasses Inventory
DROP POLICY IF EXISTS "all_manage_glasses" ON public.glasses_inventory;
DROP POLICY IF EXISTS "All view glasses" ON public.glasses_inventory;
DROP POLICY IF EXISTS "Frontdesk/admin manage glasses" ON public.glasses_inventory;
-- Glasses Orders
DROP POLICY IF EXISTS "all_manage_glasses_orders" ON public.glasses_orders;
DROP POLICY IF EXISTS "All view orders" ON public.glasses_orders;
DROP POLICY IF EXISTS "Frontdesk/admin manage orders" ON public.glasses_orders;
-- Inventory Others
DROP POLICY IF EXISTS "all_manage_inventory_others" ON public.inventory_others;
DROP POLICY IF EXISTS "All view inventory others" ON public.inventory_others;
DROP POLICY IF EXISTS "Frontdesk/admin manage inventory others" ON public.inventory_others;
DROP POLICY IF EXISTS "Frontdesk/admin insert inventory others" ON public.inventory_others;
-- Inventory Dispensing
DROP POLICY IF EXISTS "all_manage_inventory_dispensing" ON public.inventory_dispensing;
DROP POLICY IF EXISTS "All view inventory dispensing" ON public.inventory_dispensing;
DROP POLICY IF EXISTS "Frontdesk/admin dispense items" ON public.inventory_dispensing;
DROP POLICY IF EXISTS "Frontdesk/admin delete dispensing" ON public.inventory_dispensing;
-- Payments
DROP POLICY IF EXISTS "all_manage_payments" ON public.payments;
DROP POLICY IF EXISTS "Finance view payments" ON public.payments;
DROP POLICY IF EXISTS "Frontdesk/admin insert payments" ON public.payments;
DROP POLICY IF EXISTS "Admin manage payments" ON public.payments;
DROP POLICY IF EXISTS "Frontdesk insert payments" ON public.payments;
-- Messages, Notifications, Audit Logs
DROP POLICY IF EXISTS "all_manage_messages" ON public.messages;
DROP POLICY IF EXISTS "all_manage_notifications" ON public.notifications;
DROP POLICY IF EXISTS "all_manage_audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admin and manager view audit" ON public.audit_logs;
DROP POLICY IF EXISTS "Append audit" ON public.audit_logs;
DROP POLICY IF EXISTS "all_manage_outreach_log" ON public.outreach_log;
DROP POLICY IF EXISTS "Frontdesk/admin outreach" ON public.outreach_log;
DROP POLICY IF EXISTS "all_manage_settings" ON public.settings;
DROP POLICY IF EXISTS "Authenticated read settings" ON public.settings;
DROP POLICY IF EXISTS "Admin manage settings" ON public.settings;
DROP POLICY IF EXISTS "all_manage_push_subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Own push sub" ON public.push_subscriptions;
-- ============================================================================
-- CREATE PERMISSIVE POLICIES
-- ============================================================================
CREATE POLICY "full_access_profiles" ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "full_access_patients" ON public.patients FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "full_access_appointments" ON public.appointments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "full_access_case_notes" ON public.case_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "full_access_prescriptions" ON public.prescriptions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "full_access_drugs" ON public.drugs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "full_access_drug_dispensing" ON public.drug_dispensing FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "full_access_glasses" ON public.glasses_inventory FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "full_access_glasses_orders" ON public.glasses_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "full_access_inventory_others" ON public.inventory_others FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "full_access_inventory_dispensing" ON public.inventory_dispensing FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "full_access_payments" ON public.payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "full_access_messages" ON public.messages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "full_access_notifications" ON public.notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "full_access_audit_logs" ON public.audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "full_access_outreach_log" ON public.outreach_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "full_access_settings" ON public.settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "full_access_push_subscriptions" ON public.push_subscriptions FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- ============================================================================
-- FOREIGN KEY FIX
-- ============================================================================
ALTER TABLE public.glasses_orders DROP CONSTRAINT IF EXISTS glasses_orders_frame_id_fkey;
ALTER TABLE public.glasses_orders
ADD CONSTRAINT glasses_orders_frame_id_fkey FOREIGN KEY (frame_id) REFERENCES public.glasses_inventory(id) ON DELETE
SET NULL;
-- ============================================================================
-- CREATE PROFILE IF MISSING
-- ============================================================================
INSERT INTO public.profiles (id, full_name, role, is_active)
SELECT auth.uid(),
  'Admin User',
  'admin',
  true
WHERE NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
  ) ON CONFLICT (id) DO NOTHING;
-- Done!