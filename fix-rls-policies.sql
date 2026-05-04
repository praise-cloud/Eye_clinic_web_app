-- FIX RLS POLICIES FOR USER MANAGEMENT
-- Run this in Supabase SQL Editor to fix delete/creation issues

-- Fix Profiles RLS Policies
DROP POLICY IF EXISTS "profiles_select_all_active" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_trigger" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_manage" ON public.profiles;
DROP POLICY IF EXISTS "profiles_manager_manage" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own_or_admin" ON public.profiles;

-- Recreate with proper permissions
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "profiles_update_own_or_admin" ON public.profiles FOR UPDATE TO authenticated USING (
    id = auth.uid() OR 
    get_user_role() IN ('admin', 'manager')
);
CREATE POLICY "profiles_delete_admin_only" ON public.profiles FOR DELETE TO authenticated USING (
    get_user_role() = 'admin'
);

-- Fix Patients RLS Policies
DROP POLICY IF EXISTS "read_patients" ON public.patients;
DROP POLICY IF EXISTS "insert_patients" ON public.patients;
DROP POLICY IF EXISTS "update_patients" ON public.patients;
DROP POLICY IF EXISTS "delete_patients" ON public.patients;
DROP POLICY IF EXISTS "delete_patients_service" ON public.patients;

-- Recreate with proper permissions
CREATE POLICY "read_patients" ON public.patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_patients" ON public.patients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_patients" ON public.patients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_patients_admin_frontdesk" ON public.patients FOR DELETE TO authenticated USING (
    get_user_role() IN ('admin', 'frontdesk')
);

-- Fix Appointments RLS Policies
DROP POLICY IF EXISTS "read_appointments" ON public.appointments;
DROP POLICY IF EXISTS "insert_appointments" ON public.appointments;
DROP POLICY IF EXISTS "update_appointments" ON public.appointments;
DROP POLICY IF EXISTS "delete_appointments" ON public.appointments;

-- Recreate with proper permissions
CREATE POLICY "read_appointments" ON public.appointments FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_appointments" ON public.appointments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_appointments" ON public.appointments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_appointments_admin_doctor" ON public.appointments FOR DELETE TO authenticated USING (
    get_user_role() = 'admin' OR doctor_id = auth.uid()
);

-- Fix Case Notes RLS Policies
DROP POLICY IF EXISTS "read_case_notes" ON public.case_notes;
DROP POLICY IF EXISTS "insert_case_notes" ON public.case_notes;
DROP POLICY IF EXISTS "update_case_notes" ON public.case_notes;
DROP POLICY IF EXISTS "delete_case_notes" ON public.case_notes;

-- Recreate with proper permissions
CREATE POLICY "read_case_notes" ON public.case_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_case_notes" ON public.case_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_case_notes" ON public.case_notes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_case_notes_admin_doctor" ON public.case_notes FOR DELETE TO authenticated USING (
    get_user_role() = 'admin' OR doctor_id = auth.uid()
);

-- Fix Prescriptions RLS Policies
DROP POLICY IF EXISTS "read_prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "insert_prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "update_prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "delete_prescriptions" ON public.prescriptions;

-- Recreate with proper permissions
CREATE POLICY "read_prescriptions" ON public.prescriptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_prescriptions" ON public.prescriptions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_prescriptions" ON public.prescriptions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_prescriptions_admin_doctor" ON public.prescriptions FOR DELETE TO authenticated USING (
    get_user_role() = 'admin' OR doctor_id = auth.uid()
);

-- Fix Payments RLS Policies
DROP POLICY IF EXISTS "read_payments" ON public.payments;
DROP POLICY IF EXISTS "insert_payments" ON public.payments;
DROP POLICY IF EXISTS "update_payments" ON public.payments;
DROP POLICY IF EXISTS "delete_payments" ON public.payments;

-- Recreate with proper permissions
CREATE POLICY "read_payments" ON public.payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_payments" ON public.payments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_payments_admin_only" ON public.payments FOR DELETE TO authenticated USING (
    get_user_role() = 'admin'
);

-- Fix Drugs RLS Policies
DROP POLICY IF EXISTS "read_drugs" ON public.drugs;
DROP POLICY IF EXISTS "insert_drugs" ON public.drugs;
DROP POLICY IF EXISTS "update_drugs" ON public.drugs;
DROP POLICY IF EXISTS "delete_drugs" ON public.drugs;

-- Recreate with proper permissions
CREATE POLICY "read_drugs" ON public.drugs FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_drugs" ON public.drugs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_drugs" ON public.drugs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_drugs_admin_only" ON public.drugs FOR DELETE TO authenticated USING (
    get_user_role() = 'admin'
);

-- Fix Glasses Inventory RLS Policies
DROP POLICY IF EXISTS "read_glasses_inventory" ON public.glasses_inventory;
DROP POLICY IF EXISTS "insert_glasses_inventory" ON public.glasses_inventory;
DROP POLICY IF EXISTS "update_glasses_inventory" ON public.glasses_inventory;
DROP POLICY IF EXISTS "delete_glasses_inventory" ON public.glasses_inventory;

-- Recreate with proper permissions
CREATE POLICY "read_glasses_inventory" ON public.glasses_inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_glasses_inventory" ON public.glasses_inventory FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_glasses_inventory" ON public.glasses_inventory FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_glasses_inventory_admin_only" ON public.glasses_inventory FOR DELETE TO authenticated USING (
    get_user_role() = 'admin'
);

-- Fix Glasses Orders RLS Policies
DROP POLICY IF EXISTS "read_glasses_orders" ON public.glasses_orders;
DROP POLICY IF EXISTS "insert_glasses_orders" ON public.glasses_orders;
DROP POLICY IF EXISTS "update_glasses_orders" ON public.glasses_orders;
DROP POLICY IF EXISTS "delete_glasses_orders" ON public.glasses_orders;

-- Recreate with proper permissions
CREATE POLICY "read_glasses_orders" ON public.glasses_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_glasses_orders" ON public.glasses_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_glasses_orders" ON public.glasses_orders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_glasses_orders_admin_only" ON public.glasses_orders FOR DELETE TO authenticated USING (
    get_user_role() = 'admin'
);

SELECT 'RLS policies fixed for proper user management' as status;
