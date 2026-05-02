-- ========================
-- EMERGENCY FIXES FOR CRITICAL ISSUES
-- ========================

-- Fix 1: Ensure profiles table allows all authenticated users to read their own profile
DROP POLICY IF EXISTS "profiles_select_all_active" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_trigger" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_manage" ON public.profiles;

CREATE POLICY "profiles_select_own" ON public.profiles 
FOR SELECT TO authenticated 
USING (id = auth.uid());

CREATE POLICY "profiles_insert_self" ON public.profiles 
FOR INSERT TO authenticated 
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own" ON public.profiles 
FOR UPDATE TO authenticated 
USING (id = auth.uid());

CREATE POLICY "profiles_admin_manage" ON public.profiles 
FOR ALL TO authenticated 
USING (get_user_role() = 'admin');

-- Fix 2: Ensure patients table allows frontdesk to delete (as requested)
DROP POLICY IF EXISTS "delete_patients" ON public.patients;
CREATE POLICY "delete_patients" ON public.patients
FOR DELETE TO authenticated
USING (get_user_role() IN ('frontdesk', 'admin'));

-- Fix 3: Ensure appointments table allows all authenticated users to create
DROP POLICY IF EXISTS "insert_appointments" ON public.appointments;
CREATE POLICY "insert_appointments" ON public.appointments
FOR INSERT TO authenticated
WITH CHECK (true);

-- Fix 4: Ensure messages table works properly
DROP POLICY IF EXISTS "read_own_messages" ON public.messages;
DROP POLICY IF EXISTS "send_messages" ON public.messages;
DROP POLICY IF EXISTS "delete_own_messages" ON public.messages;
DROP POLICY IF EXISTS "update_messages" ON public.messages;

CREATE POLICY "read_own_messages" ON public.messages
FOR SELECT TO authenticated
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "send_messages" ON public.messages
FOR INSERT TO authenticated
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "update_own_messages" ON public.messages
FOR UPDATE TO authenticated
USING (sender_id = auth.uid() OR receiver_id = auth.uid())
WITH CHECK (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "delete_own_messages" ON public.messages
FOR DELETE TO authenticated
USING (sender_id = auth.uid());

-- Fix 5: Ensure inventory tables work for frontdesk
DROP POLICY IF EXISTS "read_drugs" ON public.drugs;
DROP POLICY IF EXISTS "insert_drugs" ON public.drugs;
DROP POLICY IF EXISTS "update_drugs" ON public.drugs;
DROP POLICY IF EXISTS "delete_drugs" ON public.drugs;

CREATE POLICY "read_drugs" ON public.drugs
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "insert_drugs" ON public.drugs
FOR INSERT TO authenticated
WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));

CREATE POLICY "update_drugs" ON public.drugs
FOR UPDATE TO authenticated
USING (get_user_role() IN ('frontdesk', 'admin'))
WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));

CREATE POLICY "delete_drugs" ON public.drugs
FOR DELETE TO authenticated
USING (get_user_role() = 'admin');

-- Fix 6: Ensure glasses inventory works
DROP POLICY IF EXISTS "read_glasses_inventory" ON public.glasses_inventory;
DROP POLICY IF EXISTS "insert_glasses_inventory" ON public.glasses_inventory;
DROP POLICY IF EXISTS "update_glasses_inventory" ON public.glasses_inventory;
DROP POLICY IF EXISTS "delete_glasses_inventory" ON public.glasses_inventory;

CREATE POLICY "read_glasses_inventory" ON public.glasses_inventory
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "insert_glasses_inventory" ON public.glasses_inventory
FOR INSERT TO authenticated
WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));

CREATE POLICY "update_glasses_inventory" ON public.glasses_inventory
FOR UPDATE TO authenticated
USING (get_user_role() IN ('frontdesk', 'admin'))
WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));

CREATE POLICY "delete_glasses_inventory" ON public.glasses_inventory
FOR DELETE TO authenticated
USING (get_user_role() = 'admin');

-- Fix 7: Ensure payments table works for admin
DROP POLICY IF EXISTS "read_payments" ON public.payments;
DROP POLICY IF EXISTS "insert_payments" ON public.payments;
DROP POLICY IF EXISTS "update_payments" ON public.payments;
DROP POLICY IF EXISTS "delete_payments" ON public.payments;

CREATE POLICY "read_payments" ON public.payments
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "insert_payments" ON public.payments
FOR INSERT TO authenticated
WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "update_payments" ON public.payments
FOR UPDATE TO authenticated
USING (get_user_role() = 'admin')
WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "delete_payments" ON public.payments
FOR DELETE TO authenticated
USING (get_user_role() = 'admin');

-- Fix 8: Ensure case notes work for doctors
DROP POLICY IF EXISTS "read_case_notes" ON public.case_notes;
DROP POLICY IF EXISTS "insert_case_notes" ON public.case_notes;
DROP POLICY IF EXISTS "update_case_notes" ON public.case_notes;
DROP POLICY IF EXISTS "delete_case_notes" ON public.case_notes;

CREATE POLICY "read_case_notes" ON public.case_notes
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "insert_case_notes" ON public.case_notes
FOR INSERT TO authenticated
WITH CHECK (get_user_role() = 'doctor');

CREATE POLICY "update_case_notes" ON public.case_notes
FOR UPDATE TO authenticated
USING (get_user_role() = 'doctor')
WITH CHECK (get_user_role() = 'doctor');

CREATE POLICY "delete_case_notes" ON public.case_notes
FOR DELETE TO authenticated
USING (get_user_role() = 'admin');

-- Done!
SELECT 'Emergency fixes applied successfully' as status;
