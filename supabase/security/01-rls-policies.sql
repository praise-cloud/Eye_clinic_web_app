-- =============================================
-- EYE CLINIC DATABASE - ROW LEVEL SECURITY POLICIES
-- =============================================

-- =============================================
-- PROFILES TABLE POLICIES
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_manage" ON public.profiles;
DROP POLICY IF EXISTS "profiles_manager_manage" ON public.profiles;

-- Create new policies
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT TO authenticated
    USING (id = auth.uid());

CREATE POLICY "profiles_select_active" ON public.profiles
    FOR SELECT TO authenticated
    USING (is_active = true);

CREATE POLICY "profiles_insert_self" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_admin_manage" ON public.profiles
    FOR ALL TO authenticated
    USING (get_user_role() = 'admin')
    WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "profiles_manager_manage" ON public.profiles
    FOR ALL TO authenticated
    USING (get_user_role() = 'manager')
    WITH CHECK (get_user_role() = 'manager');

-- =============================================
-- PATIENTS TABLE POLICIES
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "patients_select_all" ON public.patients;
DROP POLICY IF EXISTS "patients_insert_frontdesk_admin" ON public.patients;
DROP POLICY IF EXISTS "patients_update_frontdesk_admin" ON public.patients;
DROP POLICY IF EXISTS "patients_delete_frontdesk_admin" ON public.patients;

-- Create new policies
CREATE POLICY "patients_select_all" ON public.patients
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "patients_insert_frontdesk_admin" ON public.patients
    FOR INSERT TO authenticated
    WITH CHECK (get_user_role() IN ('frontdesk', 'admin', 'manager'));

CREATE POLICY "patients_update_frontdesk_admin" ON public.patients
    FOR UPDATE TO authenticated
    USING (get_user_role() IN ('frontdesk', 'admin', 'manager'))
    WITH CHECK (get_user_role() IN ('frontdesk', 'admin', 'manager'));

CREATE POLICY "patients_delete_frontdesk_admin" ON public.patients
    FOR DELETE TO authenticated
    USING (get_user_role() IN ('frontdesk', 'admin'));

-- =============================================
-- APPOINTMENTS TABLE POLICIES
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "appointments_select_all" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert_all" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update_all" ON public.appointments;
DROP POLICY IF EXISTS "appointments_delete_frontdesk_admin" ON public.appointments;

-- Create new policies
CREATE POLICY "appointments_select_all" ON public.appointments
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "appointments_insert_all" ON public.appointments
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "appointments_update_all" ON public.appointments
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "appointments_delete_frontdesk_admin" ON public.appointments
    FOR DELETE TO authenticated
    USING (get_user_role() IN ('frontdesk', 'admin'));

-- =============================================
-- CASE NOTES TABLE POLICIES
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "case_notes_select_all" ON public.case_notes;
DROP POLICY IF EXISTS "case_notes_insert_doctor" ON public.case_notes;
DROP POLICY IF EXISTS "case_notes_update_doctor" ON public.case_notes;
DROP POLICY IF EXISTS "case_notes_delete_admin" ON public.case_notes;

-- Create new policies
CREATE POLICY "case_notes_select_all" ON public.case_notes
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "case_notes_insert_doctor" ON public.case_notes
    FOR INSERT TO authenticated
    WITH CHECK (get_user_role() = 'doctor');

CREATE POLICY "case_notes_update_doctor" ON public.case_notes
    FOR UPDATE TO authenticated
    USING (get_user_role() = 'doctor')
    WITH CHECK (get_user_role() = 'doctor');

CREATE POLICY "case_notes_delete_admin" ON public.case_notes
    FOR DELETE TO authenticated
    USING (get_user_role() = 'admin');

-- =============================================
-- PRESCRIPTIONS TABLE POLICIES
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "prescriptions_select_all" ON public.prescriptions;
DROP POLICY IF EXISTS "prescriptions_insert_doctor" ON public.prescriptions;
DROP POLICY IF EXISTS "prescriptions_update_doctor" ON public.prescriptions;
DROP POLICY IF EXISTS "prescriptions_delete_admin" ON public.prescriptions;

-- Create new policies
CREATE POLICY "prescriptions_select_all" ON public.prescriptions
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "prescriptions_insert_doctor" ON public.prescriptions
    FOR INSERT TO authenticated
    WITH CHECK (get_user_role() = 'doctor');

CREATE POLICY "prescriptions_update_doctor" ON public.prescriptions
    FOR UPDATE TO authenticated
    USING (get_user_role() = 'doctor')
    WITH CHECK (get_user_role() = 'doctor');

CREATE POLICY "prescriptions_delete_admin" ON public.prescriptions
    FOR DELETE TO authenticated
    USING (get_user_role() = 'admin');

-- =============================================
-- INVENTORY TABLE POLICIES
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "drugs_select_all" ON public.drugs;
DROP POLICY IF EXISTS "drugs_insert_frontdesk_admin" ON public.drugs;
DROP POLICY IF EXISTS "drugs_update_frontdesk_admin" ON public.drugs;
DROP POLICY IF EXISTS "drugs_delete_admin" ON public.drugs;

-- Create new policies
CREATE POLICY "drugs_select_all" ON public.drugs
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "drugs_insert_frontdesk_admin" ON public.drugs
    FOR INSERT TO authenticated
    WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));

CREATE POLICY "drugs_update_frontdesk_admin" ON public.drugs
    FOR UPDATE TO authenticated
    USING (get_user_role() IN ('frontdesk', 'admin'))
    WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));

CREATE POLICY "drugs_delete_admin" ON public.drugs
    FOR DELETE TO authenticated
    USING (get_user_role() = 'admin');

-- Glasses inventory policies
DROP POLICY IF EXISTS "glasses_inventory_select_all" ON public.glasses_inventory;
DROP POLICY IF EXISTS "glasses_inventory_insert_frontdesk_admin" ON public.glasses_inventory;
DROP POLICY IF EXISTS "glasses_inventory_update_frontdesk_admin" ON public.glasses_inventory;
DROP POLICY IF EXISTS "glasses_inventory_delete_admin" ON public.glasses_inventory;

CREATE POLICY "glasses_inventory_select_all" ON public.glasses_inventory
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "glasses_inventory_insert_frontdesk_admin" ON public.glasses_inventory
    FOR INSERT TO authenticated
    WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));

CREATE POLICY "glasses_inventory_update_frontdesk_admin" ON public.glasses_inventory
    FOR UPDATE TO authenticated
    USING (get_user_role() IN ('frontdesk', 'admin'))
    WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));

CREATE POLICY "glasses_inventory_delete_admin" ON public.glasses_inventory
    FOR DELETE TO authenticated
    USING (get_user_role() = 'admin');

-- Inventory others policies
DROP POLICY IF EXISTS "inventory_others_select_all" ON public.inventory_others;
DROP POLICY IF EXISTS "inventory_others_insert_frontdesk_admin" ON public.inventory_others;
DROP POLICY IF EXISTS "inventory_others_update_frontdesk_admin" ON public.inventory_others;
DROP POLICY IF EXISTS "inventory_others_delete_admin" ON public.inventory_others;

CREATE POLICY "inventory_others_select_all" ON public.inventory_others
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "inventory_others_insert_frontdesk_admin" ON public.inventory_others
    FOR INSERT TO authenticated
    WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));

CREATE POLICY "inventory_others_update_frontdesk_admin" ON public.inventory_others
    FOR UPDATE TO authenticated
    USING (get_user_role() IN ('frontdesk', 'admin'))
    WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));

CREATE POLICY "inventory_others_delete_admin" ON public.inventory_others
    FOR DELETE TO authenticated
    USING (get_user_role() = 'admin');

-- =============================================
-- DISPENSING TABLE POLICIES
-- =============================================

-- Drug dispensing policies
DROP POLICY IF EXISTS "drug_dispensing_select_all" ON public.drug_dispensing;
DROP POLICY IF EXISTS "drug_dispensing_insert_frontdesk_admin" ON public.drug_dispensing;
DROP POLICY IF EXISTS "drug_dispensing_update_frontdesk_admin" ON public.drug_dispensing;
DROP POLICY IF EXISTS "drug_dispensing_delete_frontdesk_admin" ON public.drug_dispensing;

CREATE POLICY "drug_dispensing_select_all" ON public.drug_dispensing
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "drug_dispensing_insert_frontdesk_admin" ON public.drug_dispensing
    FOR INSERT TO authenticated
    WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));

CREATE POLICY "drug_dispensing_update_frontdesk_admin" ON public.drug_dispensing
    FOR UPDATE TO authenticated
    USING (get_user_role() IN ('frontdesk', 'admin'))
    WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));

CREATE POLICY "drug_dispensing_delete_frontdesk_admin" ON public.drug_dispensing
    FOR DELETE TO authenticated
    USING (get_user_role() IN ('frontdesk', 'admin'));

-- Inventory dispensing policies
DROP POLICY IF EXISTS "inventory_dispensing_select_all" ON public.inventory_dispensing;
DROP POLICY IF EXISTS "inventory_dispensing_insert_frontdesk_admin" ON public.inventory_dispensing;
DROP POLICY IF EXISTS "inventory_dispensing_update_frontdesk_admin" ON public.inventory_dispensing;
DROP POLICY IF EXISTS "inventory_dispensing_delete_frontdesk_admin" ON public.inventory_dispensing;

CREATE POLICY "inventory_dispensing_select_all" ON public.inventory_dispensing
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "inventory_dispensing_insert_frontdesk_admin" ON public.inventory_dispensing
    FOR INSERT TO authenticated
    WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));

CREATE POLICY "inventory_dispensing_update_frontdesk_admin" ON public.inventory_dispensing
    FOR UPDATE TO authenticated
    USING (get_user_role() IN ('frontdesk', 'admin'))
    WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));

CREATE POLICY "inventory_dispensing_delete_frontdesk_admin" ON public.inventory_dispensing
    FOR DELETE TO authenticated
    USING (get_user_role() IN ('frontdesk', 'admin'));

-- =============================================
-- PAYMENTS TABLE POLICIES
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "payments_select_all" ON public.payments;
DROP POLICY IF EXISTS "payments_insert_admin" ON public.payments;
DROP POLICY IF EXISTS "payments_update_admin" ON public.payments;
DROP POLICY IF EXISTS "payments_delete_admin" ON public.payments;

-- Create new policies
CREATE POLICY "payments_select_all" ON public.payments
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "payments_insert_admin" ON public.payments
    FOR INSERT TO authenticated
    WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "payments_update_admin" ON public.payments
    FOR UPDATE TO authenticated
    USING (get_user_role() = 'admin')
    WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "payments_delete_admin" ON public.payments
    FOR DELETE TO authenticated
    USING (get_user_role() = 'admin');

-- =============================================
-- COMMUNICATION TABLE POLICIES
-- =============================================

-- Messages policies
DROP POLICY IF EXISTS "messages_select_own" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_own" ON public.messages;
DROP POLICY IF EXISTS "messages_update_own" ON public.messages;
DROP POLICY IF EXISTS "messages_delete_own" ON public.messages;

CREATE POLICY "messages_select_own" ON public.messages
    FOR SELECT TO authenticated
    USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "messages_insert_own" ON public.messages
    FOR INSERT TO authenticated
    WITH CHECK (sender_id = auth.uid());

CREATE POLICY "messages_update_own" ON public.messages
    FOR UPDATE TO authenticated
    USING (sender_id = auth.uid() OR receiver_id = auth.uid())
    WITH CHECK (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "messages_delete_own" ON public.messages
    FOR DELETE TO authenticated
    USING (sender_id = auth.uid());

-- Notifications policies
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;

CREATE POLICY "notifications_select_own" ON public.notifications
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "notifications_insert_own" ON public.notifications
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON public.notifications
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_delete_own" ON public.notifications
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- Settings policies
DROP POLICY IF EXISTS "settings_select_public" ON public.settings;
DROP POLICY IF EXISTS "settings_select_all" ON public.settings;
DROP POLICY IF EXISTS "settings_write_admin_manager" ON public.settings;
DROP POLICY IF EXISTS "settings_write_own_notification" ON public.settings;

CREATE POLICY "settings_select_public" ON public.settings
    FOR SELECT TO authenticated
    USING (is_public = true);

CREATE POLICY "settings_select_all" ON public.settings
    FOR SELECT TO authenticated
    USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "settings_write_admin_manager" ON public.settings
    FOR ALL TO authenticated
    USING (get_user_role() IN ('admin', 'manager'))
    WITH CHECK (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "settings_write_own_notification" ON public.settings
    FOR ALL TO authenticated
    USING (key LIKE auth.uid()::text || '\_%' ESCAPE '\')
    WITH CHECK (key LIKE auth.uid()::text || '\_%' ESCAPE '\');

-- Push subscriptions policies
DROP POLICY IF EXISTS "push_subscriptions_select_own" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_insert_own" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_update_own" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_delete_own" ON public.push_subscriptions;

CREATE POLICY "push_subscriptions_select_own" ON public.push_subscriptions
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "push_subscriptions_insert_own" ON public.push_subscriptions
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_subscriptions_update_own" ON public.push_subscriptions
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_subscriptions_delete_own" ON public.push_subscriptions
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- Audit logs policies
DROP POLICY IF EXISTS "audit_logs_select_admin_manager" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_system" ON public.audit_logs;

CREATE POLICY "audit_logs_select_admin_manager" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "audit_logs_insert_system" ON public.audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

SELECT 'RLS policies created successfully' as status;
