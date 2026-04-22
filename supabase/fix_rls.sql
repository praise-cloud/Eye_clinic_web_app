-- Fix RLS policies to allow all authenticated users to read appointments
-- Run this in Supabase SQL Editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can manage appointments" ON public.appointments;
DROP POLICY IF EXISTS "Staff manage appointments" ON public.appointments;
DROP POLICY IF EXISTS "All staff view appointments" ON public.appointments;

-- Simple policy: any authenticated user can read all appointments
CREATE POLICY "authenticated_read_appointments"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (true);

-- Any authenticated staff can insert appointments
CREATE POLICY "authenticated_insert_appointments"
  ON public.appointments FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Any authenticated staff can update appointments
CREATE POLICY "authenticated_update_appointments"
  ON public.appointments FOR UPDATE
  TO authenticated
  USING (true);

-- Only admin can delete
CREATE POLICY "admin_delete_appointments"
  ON public.appointments FOR DELETE
  TO authenticated
  USING (get_user_role() = 'admin');

-- Also fix patients table
DROP POLICY IF EXISTS "Authenticated users can manage patients" ON public.patients;
DROP POLICY IF EXISTS "Medical staff can view patients" ON public.patients;
DROP POLICY IF EXISTS "All staff view patients" ON public.patients;
DROP POLICY IF EXISTS "Assistant and admin can create patients" ON public.patients;
DROP POLICY IF EXISTS "Assistant and admin can update patients" ON public.patients;
DROP POLICY IF EXISTS "Assistant/admin create patients" ON public.patients;
DROP POLICY IF EXISTS "Assistant/admin update patients" ON public.patients;

CREATE POLICY "authenticated_read_patients"
  ON public.patients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_insert_patients"
  ON public.patients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_update_patients"
  ON public.patients FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_delete_patients"
  ON public.patients FOR DELETE
  TO authenticated
  USING (true);

-- Fix prescriptions
DROP POLICY IF EXISTS "Authenticated users can manage prescriptions" ON public.prescriptions;

CREATE POLICY "authenticated_all_prescriptions"
  ON public.prescriptions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Fix drug_dispensing
DROP POLICY IF EXISTS "View dispensing" ON public.drug_dispensing;
DROP POLICY IF EXISTS "Assistant dispenses" ON public.drug_dispensing;

CREATE POLICY "authenticated_all_dispensing"
  ON public.drug_dispensing FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Fix payments
DROP POLICY IF EXISTS "Finance view payments" ON public.payments;
DROP POLICY IF EXISTS "Assistant insert payments" ON public.payments;
DROP POLICY IF EXISTS "Accountant/admin manage payments" ON public.payments;

CREATE POLICY "authenticated_all_payments"
  ON public.payments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Fix case_notes
DROP POLICY IF EXISTS "Doctors and admin can view case notes" ON public.case_notes;
DROP POLICY IF EXISTS "Doctors can create case notes" ON public.case_notes;
DROP POLICY IF EXISTS "Doctors can update their own case notes" ON public.case_notes;
DROP POLICY IF EXISTS "Doctors/admin view notes" ON public.case_notes;
DROP POLICY IF EXISTS "Doctors create notes" ON public.case_notes;
DROP POLICY IF EXISTS "Doctors update own notes" ON public.case_notes;

CREATE POLICY "authenticated_all_case_notes"
  ON public.case_notes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Fix glasses tables
DROP POLICY IF EXISTS "All view glasses" ON public.glasses_inventory;
DROP POLICY IF EXISTS "Assistant/admin manage glasses" ON public.glasses_inventory;
DROP POLICY IF EXISTS "All view orders" ON public.glasses_orders;
DROP POLICY IF EXISTS "Assistant/admin manage orders" ON public.glasses_orders;

CREATE POLICY "authenticated_all_glasses_inventory"
  ON public.glasses_inventory FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_all_glasses_orders"
  ON public.glasses_orders FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Fix drugs
DROP POLICY IF EXISTS "All staff view drugs" ON public.drugs;
DROP POLICY IF EXISTS "Assistant/admin manage drugs" ON public.drugs;

CREATE POLICY "authenticated_all_drugs"
  ON public.drugs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Fix messages (chat)
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Own messages" ON public.messages;
DROP POLICY IF EXISTS "Send messages" ON public.messages;

CREATE POLICY "authenticated_read_messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "authenticated_send_messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "authenticated_delete_own_messages"
  ON public.messages FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());
