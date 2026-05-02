  -- ========================
  -- Fix patient references with ON DELETE CASCADE
  -- ========================

  -- Add ON DELETE CASCADE to all tables that reference patients
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

  -- ========================
  -- Drop all existing policies to avoid conflicts
  -- ========================

  -- Drop any existing policies to start fresh
  DROP POLICY IF EXISTS "all_authenticated_case_notes" ON public.case_notes;
  DROP POLICY IF EXISTS "read_own_messages" ON public.messages;
  DROP POLICY IF EXISTS "send_messages" ON public.messages;
  DROP POLICY IF EXISTS "delete_own_messages" ON public.messages;
  DROP POLICY IF EXISTS "all_authenticated_appointments" ON public.appointments;
  DROP POLICY IF EXISTS "all_authenticated_patients" ON public.patients;
  DROP POLICY IF EXISTS "all_authenticated_prescriptions" ON public.prescriptions;
  DROP POLICY IF EXISTS "all_authenticated_dispensing" ON public.drug_dispensing;
  DROP POLICY IF EXISTS "all_authenticated_payments" ON public.payments;
  DROP POLICY IF EXISTS "all_authenticated_glasses_inventory" ON public.glasses_inventory;
  DROP POLICY IF EXISTS "all_authenticated_glasses_orders" ON public.glasses_orders;
  DROP POLICY IF EXISTS "all_authenticated_drugs" ON public.drugs;
  DROP POLICY IF EXISTS "all_authenticated_profiles" ON public.profiles;

  -- ========================
  -- Create clean simplified RLS policies
  -- ========================

  -- PROFILES TABLE POLICIES (critical for authentication)
  CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
  CREATE POLICY "profiles_insert_trigger" ON public.profiles FOR INSERT TO authenticated WITH CHECK (true);
  CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
  CREATE POLICY "profiles_admin_manage" ON public.profiles FOR ALL TO authenticated USING (get_user_role() = 'admin');

  -- All authenticated users can read case notes, only admins can delete
  CREATE POLICY "read_case_notes" ON public.case_notes FOR SELECT TO authenticated USING (true);
  CREATE POLICY "insert_case_notes" ON public.case_notes FOR INSERT TO authenticated WITH CHECK (true);
  CREATE POLICY "update_case_notes" ON public.case_notes FOR UPDATE TO authenticated USING (true);
  CREATE POLICY "delete_case_notes" ON public.case_notes FOR DELETE TO authenticated USING (get_user_role() = 'admin');

  -- Users can only read their own messages
  CREATE POLICY "read_own_messages" ON public.messages FOR SELECT TO authenticated USING (sender_id = auth.uid() OR receiver_id = auth.uid());

  -- Users can send messages
  CREATE POLICY "send_messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());

  -- Users can delete their own messages
  CREATE POLICY "delete_own_messages" ON public.messages FOR DELETE TO authenticated USING (sender_id = auth.uid());

  -- All authenticated users can read appointments, only admins can delete
  CREATE POLICY "read_appointments" ON public.appointments FOR SELECT TO authenticated USING (true);
  CREATE POLICY "insert_appointments" ON public.appointments FOR INSERT TO authenticated WITH CHECK (true);
  CREATE POLICY "update_appointments" ON public.appointments FOR UPDATE TO authenticated USING (true);
  CREATE POLICY "delete_appointments" ON public.appointments FOR DELETE TO authenticated USING (get_user_role() = 'admin');

  -- All authenticated users can read patients, only admins can delete
  CREATE POLICY "read_patients" ON public.patients FOR SELECT TO authenticated USING (true);
  CREATE POLICY "insert_patients" ON public.patients FOR INSERT TO authenticated WITH CHECK (true);
  CREATE POLICY "update_patients" ON public.patients FOR UPDATE TO authenticated USING (true);
  CREATE POLICY "delete_patients" ON public.patients FOR DELETE TO authenticated USING (get_user_role() = 'admin');

  -- All authenticated users can read prescriptions, only admins can delete
  CREATE POLICY "read_prescriptions" ON public.prescriptions FOR SELECT TO authenticated USING (true);
  CREATE POLICY "insert_prescriptions" ON public.prescriptions FOR INSERT TO authenticated WITH CHECK (true);
  CREATE POLICY "update_prescriptions" ON public.prescriptions FOR UPDATE TO authenticated USING (true);
  CREATE POLICY "delete_prescriptions" ON public.prescriptions FOR DELETE TO authenticated USING (get_user_role() = 'admin');

  -- All authenticated users can read drug dispensing, only admins can delete
  CREATE POLICY "read_drug_dispensing" ON public.drug_dispensing FOR SELECT TO authenticated USING (true);
  CREATE POLICY "insert_drug_dispensing" ON public.drug_dispensing FOR INSERT TO authenticated WITH CHECK (true);
  CREATE POLICY "update_drug_dispensing" ON public.drug_dispensing FOR UPDATE TO authenticated USING (true);
  CREATE POLICY "delete_drug_dispensing" ON public.drug_dispensing FOR DELETE TO authenticated USING (get_user_role() = 'admin');

  -- All authenticated users can read payments, only admins can delete
  CREATE POLICY "read_payments" ON public.payments FOR SELECT TO authenticated USING (true);
  CREATE POLICY "insert_payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (true);
  CREATE POLICY "update_payments" ON public.payments FOR UPDATE TO authenticated USING (true);
  CREATE POLICY "delete_payments" ON public.payments FOR DELETE TO authenticated USING (get_user_role() = 'admin');

  -- All authenticated users can read glasses inventory, only admins can delete
  CREATE POLICY "read_glasses_inventory" ON public.glasses_inventory FOR SELECT TO authenticated USING (true);
  CREATE POLICY "insert_glasses_inventory" ON public.glasses_inventory FOR INSERT TO authenticated WITH CHECK (true);
  CREATE POLICY "update_glasses_inventory" ON public.glasses_inventory FOR UPDATE TO authenticated USING (true);
  CREATE POLICY "delete_glasses_inventory" ON public.glasses_inventory FOR DELETE TO authenticated USING (get_user_role() = 'admin');

  -- All authenticated users can read glasses orders, only admins can delete
  CREATE POLICY "read_glasses_orders" ON public.glasses_orders FOR SELECT TO authenticated USING (true);
  CREATE POLICY "insert_glasses_orders" ON public.glasses_orders FOR INSERT TO authenticated WITH CHECK (true);
  CREATE POLICY "update_glasses_orders" ON public.glasses_orders FOR UPDATE TO authenticated USING (true);
  CREATE POLICY "delete_glasses_orders" ON public.glasses_orders FOR DELETE TO authenticated USING (get_user_role() = 'admin');

  -- All authenticated users can read drugs, only admins can delete
  CREATE POLICY "read_drugs" ON public.drugs FOR SELECT TO authenticated USING (true);
  CREATE POLICY "insert_drugs" ON public.drugs FOR INSERT TO authenticated WITH CHECK (true);
  CREATE POLICY "update_drugs" ON public.drugs FOR UPDATE TO authenticated USING (true);
  CREATE POLICY "delete_drugs" ON public.drugs FOR DELETE TO authenticated USING (get_user_role() = 'admin');

  -- 4. ENABLE REALTIME ON MESSAGES (needed for chat notifications)
  -- =============================================
  DO $$
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  EXCEPTION
    WHEN duplicate_object THEN
      -- Table already in publication, which is fine
      NULL;
  END $$;

  -- Done!
  SELECT 'All RLS policies and fixes applied successfully' as status;
