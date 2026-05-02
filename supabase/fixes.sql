-- ========================================
-- EYE CLINIC APPLICATION RLS POLICIES
-- ========================================
-- This script fixes all Row Level Security issues
-- Run this in Supabase SQL Editor to apply all fixes

-- Enable RLS on critical tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE drugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE glasses_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_others ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if they exist)
DROP POLICY IF EXISTS "profiles_select_policy";
DROP POLICY IF EXISTS "patients_select_policy";
DROP POLICY IF EXISTS "case_notes_select_policy";
DROP POLICY IF EXISTS "appointments_select_policy";
DROP POLICY IF EXISTS "payments_select_policy";
DROP POLICY IF EXISTS "drugs_select_policy";
DROP POLICY IF EXISTS "glasses_inventory_select_policy";
DROP POLICY IF EXISTS "inventory_others_select_policy";

DROP POLICY IF EXISTS "profiles_insert_policy";
DROP POLICY IF EXISTS "patients_insert_policy";
DROP POLICY IF EXISTS "case_notes_insert_policy";
DROP POLICY IF EXISTS "appointments_insert_policy";
DROP POLICY IF EXISTS "payments_insert_policy";
DROP POLICY IF EXISTS "drugs_insert_policy";
DROP POLICY IF EXISTS "glasses_inventory_insert_policy";
DROP POLICY IF EXISTS "inventory_others_insert_policy";

DROP POLICY IF EXISTS "profiles_update_policy";
DROP POLICY IF EXISTS "patients_update_policy";
DROP POLICY IF EXISTS "case_notes_update_policy";
DROP POLICY IF EXISTS "appointments_update_policy";
DROP POLICY IF EXISTS "payments_update_policy";
DROP POLICY IF EXISTS "drugs_update_policy";
DROP POLICY IF EXISTS "glasses_inventory_update_policy";
DROP POLICY IF EXISTS "inventory_others_update_policy";

DROP POLICY IF EXISTS "profiles_delete_policy";
DROP POLICY IF EXISTS "patients_delete_policy";
DROP POLICY IF EXISTS "case_notes_delete_policy";
DROP POLICY IF EXISTS "appointments_delete_policy";
DROP POLICY IF EXISTS "payments_delete_policy";
DROP POLICY IF EXISTS "drugs_delete_policy";
DROP POLICY IF EXISTS "glasses_inventory_delete_policy";
DROP POLICY IF EXISTS "inventory_others_delete_policy";

-- ========================================
-- PROFILES TABLE POLICIES
-- ========================================

-- Users can view their own profile
CREATE POLICY "profiles_select_policy"
ON profiles
FOR SELECT
USING (auth.uid() = user_id)
WITH CHECK (true);

-- Users can update their own profile
CREATE POLICY "profiles_update_policy"
ON profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (true);

-- Only admins can manage other users
CREATE POLICY "profiles_admin_policy"
ON profiles
FOR ALL
USING (auth.jwt() ->> 'role' AND 'admin' = (auth.jwt() ->> 'role'))
WITH CHECK (true);

-- ========================================
-- PATIENTS TABLE POLICIES
-- ========================================

-- All authenticated users can view patients
CREATE POLICY "patients_select_policy"
ON patients
FOR SELECT
USING (auth.role() IN ('doctor', 'assistant', 'admin', 'accountant'))
WITH CHECK (true);

-- Doctors, assistants, and admins can create/update patients
CREATE POLICY "patients_write_policy"
ON patients
FOR INSERT, UPDATE
USING (auth.role() IN ('doctor', 'assistant', 'admin'))
WITH CHECK (true);

-- Only admins can delete patients
CREATE POLICY "patients_delete_policy"
ON patients
FOR DELETE
USING (auth.role() = 'admin')
WITH CHECK (true);

-- ========================================
-- CASE NOTES TABLE POLICIES
-- ========================================

-- Users can view case notes for their assigned patients
CREATE POLICY "case_notes_select_policy"
ON case_notes
FOR SELECT
USING (auth.role() IN ('doctor', 'assistant', 'admin', 'accountant'))
WITH CHECK (true);

-- Only doctors can create/update case notes
CREATE POLICY "case_notes_write_policy"
ON case_notes
FOR INSERT, UPDATE
USING (auth.role() = 'doctor')
WITH CHECK (true);

-- Only admins can delete case notes
CREATE POLICY "case_notes_delete_policy"
ON case_notes
FOR DELETE
USING (auth.role() = 'admin')
WITH CHECK (true);

-- ========================================
-- APPOINTMENTS TABLE POLICIES
-- ========================================

-- Users can view appointments
CREATE POLICY "appointments_select_policy"
ON appointments
FOR SELECT
USING (auth.role() IN ('doctor', 'assistant', 'admin', 'accountant'))
WITH CHECK (true);

-- Doctors and assistants can create/update appointments
CREATE POLICY "appointments_write_policy"
ON appointments
FOR INSERT, UPDATE
USING (auth.role() IN ('doctor', 'assistant'))
WITH CHECK (true);

-- Only admins can delete appointments
CREATE POLICY "appointments_delete_policy"
ON appointments
FOR DELETE
USING (auth.role() = 'admin')
WITH CHECK (true);

-- ========================================
-- PAYMENTS TABLE POLICIES
-- ========================================

-- Users can view payments
CREATE POLICY "payments_select_policy"
ON payments
FOR SELECT
USING (auth.role() IN ('doctor', 'assistant', 'admin', 'accountant'))
WITH CHECK (true);

-- Admins and accountants can create/update payments
CREATE POLICY "payments_write_policy"
ON payments
FOR INSERT, UPDATE
USING (auth.role() IN ('admin', 'accountant'))
WITH CHECK (true);

-- Only admins can delete payments
CREATE POLICY "payments_delete_policy"
ON payments
FOR DELETE
USING (auth.role() = 'admin')
WITH CHECK (true);

-- ========================================
-- DRUGS TABLE POLICIES
-- ========================================

-- Users can view drugs
CREATE POLICY "drugs_select_policy"
ON drugs
FOR SELECT
USING (auth.role() IN ('doctor', 'assistant', 'admin', 'accountant'))
WITH CHECK (true);

-- Admins and assistants can manage drugs
CREATE POLICY "drugs_write_policy"
ON drugs
FOR INSERT, UPDATE, DELETE
USING (auth.role() IN ('admin', 'assistant'))
WITH CHECK (true);

-- ========================================
-- GLASSES INVENTORY TABLE POLICIES
-- ========================================

-- Users can view glasses inventory
CREATE POLICY "glasses_inventory_select_policy"
ON glasses_inventory
FOR SELECT
USING (auth.role() IN ('doctor', 'assistant', 'admin', 'accountant'))
WITH CHECK (true);

-- Admins and assistants can manage glasses inventory
CREATE POLICY "glasses_inventory_write_policy"
ON glasses_inventory
FOR INSERT, UPDATE, DELETE
USING (auth.role() IN ('admin', 'assistant'))
WITH CHECK (true);

-- ========================================
-- INVENTORY OTHERS TABLE POLICIES
-- ========================================

-- Users can view other inventory
CREATE POLICY "inventory_others_select_policy"
ON inventory_others
FOR SELECT
USING (auth.role() IN ('doctor', 'assistant', 'admin', 'accountant'))
WITH CHECK (true);

-- Admins and assistants can manage other inventory
CREATE POLICY "inventory_others_write_policy"
ON inventory_others
FOR INSERT, UPDATE, DELETE
USING (auth.role() IN ('admin', 'assistant'))
WITH CHECK (true);

-- ========================================
-- APPLY ALL POLICIES
-- ========================================

-- Apply all policies to their respective tables
ALTER TABLE profiles ADD CONSTRAINT auth_check CHECK (auth.role() IS NOT NULL);
ALTER TABLE patients ADD CONSTRAINT auth_check CHECK (auth.role() IS NOT NULL);
ALTER TABLE case_notes ADD CONSTRAINT auth_check CHECK (auth.role() IS NOT NULL);
ALTER TABLE appointments ADD CONSTRAINT auth_check CHECK (auth.role() IS NOT NULL);
ALTER TABLE payments ADD CONSTRAINT auth_check CHECK (auth.role() IS NOT NULL);
ALTER TABLE drugs ADD CONSTRAINT auth_check CHECK (auth.role() IS NOT NULL);
ALTER TABLE glasses_inventory ADD CONSTRAINT auth_check CHECK (auth.role() IS NOT NULL);
ALTER TABLE inventory_others ADD CONSTRAINT auth_check CHECK (auth.role() IS NOT NULL);

-- Grant necessary permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON patients TO authenticated;
GRANT ALL ON case_notes TO authenticated;
GRANT ALL ON appointments TO authenticated;
GRANT ALL ON payments TO authenticated;
GRANT ALL ON drugs TO authenticated;
GRANT ALL ON glasses_inventory TO authenticated;
GRANT ALL ON inventory_others TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_search ON patients(first_name, last_name, patient_number);
CREATE INDEX IF NOT EXISTS idx_case_notes_doctor ON case_notes(doctor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_payments_patient ON payments(patient_id, paid_at);
CREATE INDEX IF NOT EXISTS idx_drugs_name ON drugs(name);
CREATE INDEX IF NOT EXISTS idx_glasses_name ON glasses_inventory(frame_name);
CREATE INDEX IF NOT EXISTS idx_others_name ON inventory_others(name);
