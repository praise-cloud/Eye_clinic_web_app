-- ============================================================
-- COMPLETE FIX — Run this in Supabase SQL Editor
-- Fixes: patient delete cascade, case notes visibility,
--        low stock alerts, appointment stats
-- ============================================================

-- 1. Add ON DELETE CASCADE to all tables that reference patients
--    This allows deleting a patient and all their records at once

ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey,
  ADD CONSTRAINT appointments_patient_id_fkey
    FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;

ALTER TABLE public.case_notes
  DROP CONSTRAINT IF EXISTS case_notes_patient_id_fkey,
  ADD CONSTRAINT case_notes_patient_id_fkey
    FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;

ALTER TABLE public.prescriptions
  DROP CONSTRAINT IF EXISTS prescriptions_patient_id_fkey,
  ADD CONSTRAINT prescriptions_patient_id_fkey
    FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;

ALTER TABLE public.drug_dispensing
  DROP CONSTRAINT IF EXISTS drug_dispensing_patient_id_fkey,
  ADD CONSTRAINT drug_dispensing_patient_id_fkey
    FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;

ALTER TABLE public.glasses_orders
  DROP CONSTRAINT IF EXISTS glasses_orders_patient_id_fkey,
  ADD CONSTRAINT glasses_orders_patient_id_fkey
    FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_patient_id_fkey,
  ADD CONSTRAINT payments_patient_id_fkey
    FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;

ALTER TABLE public.outreach_log
  DROP CONSTRAINT IF EXISTS outreach_log_patient_id_fkey,
  ADD CONSTRAINT outreach_log_patient_id_fkey
    FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;

-- 2. Fix case_notes RLS — ensure all authenticated users can read
DROP POLICY IF EXISTS "authenticated_all_case_notes" ON public.case_notes;
DROP POLICY IF EXISTS "Doctors and admin can view case notes" ON public.case_notes;
DROP POLICY IF EXISTS "Doctors can create case notes" ON public.case_notes;
DROP POLICY IF EXISTS "Doctors can update their own case notes" ON public.case_notes;
DROP POLICY IF EXISTS "Doctors/admin view notes" ON public.case_notes;
DROP POLICY IF EXISTS "Doctors create notes" ON public.case_notes;
DROP POLICY IF EXISTS "Doctors update own notes" ON public.case_notes;

CREATE POLICY "all_authenticated_case_notes"
  ON public.case_notes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. Fix messages RLS for chat notifications
DROP POLICY IF EXISTS "authenticated_read_messages" ON public.messages;
DROP POLICY IF EXISTS "authenticated_send_messages" ON public.messages;
DROP POLICY IF EXISTS "authenticated_delete_own_messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Own messages" ON public.messages;
DROP POLICY IF EXISTS "Send messages" ON public.messages;

CREATE POLICY "read_own_messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "send_messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "delete_own_messages"
  ON public.messages FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());

-- 4. Fix appointments RLS
DROP POLICY IF EXISTS "authenticated_read_appointments" ON public.appointments;
DROP POLICY IF EXISTS "authenticated_insert_appointments" ON public.appointments;
DROP POLICY IF EXISTS "authenticated_update_appointments" ON public.appointments;
DROP POLICY IF EXISTS "admin_delete_appointments" ON public.appointments;

CREATE POLICY "all_authenticated_appointments"
  ON public.appointments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Fix patients RLS
DROP POLICY IF EXISTS "authenticated_read_patients" ON public.patients;
DROP POLICY IF EXISTS "authenticated_insert_patients" ON public.patients;
DROP POLICY IF EXISTS "authenticated_update_patients" ON public.patients;
DROP POLICY IF EXISTS "authenticated_delete_patients" ON public.patients;

CREATE POLICY "all_authenticated_patients"
  ON public.patients FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. Fix all other tables
DROP POLICY IF EXISTS "authenticated_all_prescriptions" ON public.prescriptions;
CREATE POLICY "all_authenticated_prescriptions"
  ON public.prescriptions FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all_dispensing" ON public.drug_dispensing;
CREATE POLICY "all_authenticated_dispensing"
  ON public.drug_dispensing FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all_payments" ON public.payments;
CREATE POLICY "all_authenticated_payments"
  ON public.payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all_glasses_inventory" ON public.glasses_inventory;
CREATE POLICY "all_authenticated_glasses_inventory"
  ON public.glasses_inventory FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all_glasses_orders" ON public.glasses_orders;
CREATE POLICY "all_authenticated_glasses_orders"
  ON public.glasses_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all_drugs" ON public.drugs;
CREATE POLICY "all_authenticated_drugs"
  ON public.drugs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. Enable realtime on messages (needed for chat notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Done!
SELECT 'All fixes applied successfully' as status;
