-- =============================================
-- COMPREHENSIVE RLS POLICY FIXES
-- Run this in Supabase SQL Editor to fix all CRUD issues
-- =============================================
-- =============================================
-- CASE NOTES POLICIES (Doctor role)
-- =============================================
-- Enable RLS on case_notes if not enabled
ALTER TABLE public.case_notes ENABLE ROW LEVEL SECURITY;
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Doctor manage case notes" ON public.case_notes;
DROP POLICY IF EXISTS "All view case notes" ON public.case_notes;
-- Create view policy for all authenticated users
CREATE POLICY "All view case notes" ON public.case_notes FOR
SELECT TO authenticated USING (TRUE);
-- Create full access policy for doctors
CREATE POLICY "Doctor manage case notes" ON public.case_notes FOR ALL TO authenticated USING (get_user_role() = 'doctor') WITH CHECK (get_user_role() = 'doctor');
-- =============================================
-- APPOINTMENTS POLICIES
-- =============================================
-- Enable RLS on appointments if not enabled
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
-- Drop existing policies
DROP POLICY IF EXISTS "Doctor manages own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Frontdesk/admin manage appointments" ON public.appointments;
-- Create view policy
CREATE POLICY "Doctor manages own appointments" ON public.appointments FOR
SELECT TO authenticated USING (
    doctor_id = auth.uid()
    OR get_user_role() IN ('frontdesk', 'admin', 'manager')
  );
-- Create full access for doctors, frontdesk, admin, manager
CREATE POLICY "Frontdesk/admin manage appointments" ON public.appointments FOR ALL TO authenticated USING (
  get_user_role() IN ('doctor', 'frontdesk', 'admin', 'manager')
) WITH CHECK (
  get_user_role() IN ('doctor', 'frontdesk', 'admin', 'manager')
);
-- =============================================
-- PROFILES POLICIES (Staff Management)
-- =============================================
-- Enable RLS on profiles if not enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Drop existing policies
DROP POLICY IF EXISTS "Admin manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Manager manage profiles" ON public.profiles;
-- Admin can manage all profiles
CREATE POLICY "Admin manage profiles" ON public.profiles FOR ALL TO authenticated USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
-- Manager can manage profiles
CREATE POLICY "Manager manage profiles" ON public.profiles FOR ALL TO authenticated USING (get_user_role() = 'manager') WITH CHECK (get_user_role() = 'manager');
-- =============================================
-- DRUGS INVENTORY POLICIES
-- =============================================
-- Ensure RLS is enabled
ALTER TABLE public.drugs ENABLE ROW LEVEL SECURITY;
-- Drop and recreate policy for full access
DROP POLICY IF EXISTS "Frontdesk/admin manage drugs" ON public.drugs;
CREATE POLICY "Frontdesk/admin manage drugs" ON public.drugs FOR ALL TO authenticated USING (get_user_role() IN ('frontdesk', 'admin')) WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));
-- =============================================
-- GLASSES INVENTORY POLICIES (Frames)
-- =============================================
-- Ensure RLS is enabled
ALTER TABLE public.glasses_inventory ENABLE ROW LEVEL SECURITY;
-- Drop and recreate policy for full access
DROP POLICY IF EXISTS "Frontdesk/admin manage glasses" ON public.glasses_inventory;
CREATE POLICY "Frontdesk/admin manage glasses" ON public.glasses_inventory FOR ALL TO authenticated USING (get_user_role() IN ('frontdesk', 'admin')) WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));
-- =============================================
-- INVENTORY_OTHERS POLICIES (Items)
-- =============================================
-- Ensure RLS is enabled
ALTER TABLE public.inventory_others ENABLE ROW LEVEL SECURITY;
-- Drop and recreate policy for full access
DROP POLICY IF EXISTS "Frontdesk/admin manage inventory others" ON public.inventory_others;
CREATE POLICY "Frontdesk/admin manage inventory others" ON public.inventory_others FOR ALL TO authenticated USING (get_user_role() IN ('frontdesk', 'admin')) WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));
-- =============================================
-- PAYMENTS POLICIES
-- =============================================
-- Ensure RLS is enabled
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
-- Drop and recreate policies
DROP POLICY IF EXISTS "Admin manage payments" ON public.payments;
DROP POLICY IF EXISTS "Frontdesk insert payments" ON public.payments;
DROP POLICY IF EXISTS "Finance view payments" ON public.payments;
-- Admin full access
CREATE POLICY "Admin manage payments" ON public.payments FOR ALL TO authenticated USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
-- Frontdesk can insert
CREATE POLICY "Frontdesk insert payments" ON public.payments FOR
INSERT TO authenticated WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));
-- Finance (admin and manager) can view
CREATE POLICY "Finance view payments" ON public.payments FOR
SELECT TO authenticated USING (
    get_user_role() IN ('admin', 'manager', 'frontdesk')
  );
-- =============================================
-- PATIENTS POLICIES
-- =============================================
-- Ensure RLS is enabled
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
-- Drop and recreate policy
DROP POLICY IF EXISTS "Frontdesk/admin manage patients" ON public.patients;
CREATE POLICY "Frontdesk/admin manage patients" ON public.patients FOR ALL TO authenticated USING (get_user_role() IN ('frontdesk', 'admin')) WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));
-- =============================================
-- PRESCRIPTIONS POLICIES
-- =============================================
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Doctor manage prescriptions" ON public.prescriptions;
CREATE POLICY "Doctor manage prescriptions" ON public.prescriptions FOR ALL TO authenticated USING (get_user_role() = 'doctor') WITH CHECK (get_user_role() = 'doctor');
-- =============================================
-- VERIFY POLICIES
-- Run these queries to verify all policies are created
-- =============================================
-- Check case_notes policies
SELECT 'case_notes' as table_name,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'case_notes';
-- Check appointments policies
SELECT 'appointments' as table_name,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'appointments';
-- Check profiles policies
SELECT 'profiles' as table_name,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';
-- Check patients policies
SELECT 'patients' as table_name,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'patients';
-- Check payments policies
SELECT 'payments' as table_name,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'payments';
-- =============================================
-- TEST CRUD OPERATIONS
-- After running this script, test each operation:
-- 1. Create/delete/edit patients (frontdesk)
-- 2. Add/delete frames in inventory (admin)
-- 3. Add/delete items in inventory (admin)
-- 4. Create/delete payment records (admin)
-- 5. Create case notes (doctor)
-- 6. Create appointments (doctor/frontdesk)
-- 7. Create/edit staff accounts (admin/manager)
-- =============================================
-- END OF RLS POLICY FIXES