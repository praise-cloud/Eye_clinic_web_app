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
  -- case_notes
  DROP POLICY IF EXISTS "read_case_notes" ON public.case_notes;
  DROP POLICY IF EXISTS "insert_case_notes" ON public.case_notes;
  DROP POLICY IF EXISTS "update_case_notes" ON public.case_notes;
  DROP POLICY IF EXISTS "delete_case_notes" ON public.case_notes;
  -- messages
  DROP POLICY IF EXISTS "read_own_messages" ON public.messages;
  DROP POLICY IF EXISTS "send_messages" ON public.messages;
  DROP POLICY IF EXISTS "delete_own_messages" ON public.messages;
  -- appointments
  DROP POLICY IF EXISTS "read_appointments" ON public.appointments;
  DROP POLICY IF EXISTS "insert_appointments" ON public.appointments;
  DROP POLICY IF EXISTS "update_appointments" ON public.appointments;
  DROP POLICY IF EXISTS "delete_appointments" ON public.appointments;
  -- patients
  DROP POLICY IF EXISTS "read_patients" ON public.patients;
  DROP POLICY IF EXISTS "insert_patients" ON public.patients;
  DROP POLICY IF EXISTS "update_patients" ON public.patients;
  DROP POLICY IF EXISTS "delete_patients" ON public.patients;
  -- prescriptions
  DROP POLICY IF EXISTS "read_prescriptions" ON public.prescriptions;
  DROP POLICY IF EXISTS "insert_prescriptions" ON public.prescriptions;
  DROP POLICY IF EXISTS "update_prescriptions" ON public.prescriptions;
  DROP POLICY IF EXISTS "delete_prescriptions" ON public.prescriptions;
  -- drug_dispensing
  DROP POLICY IF EXISTS "read_drug_dispensing" ON public.drug_dispensing;
  DROP POLICY IF EXISTS "insert_drug_dispensing" ON public.drug_dispensing;
  DROP POLICY IF EXISTS "update_drug_dispensing" ON public.drug_dispensing;
  DROP POLICY IF EXISTS "delete_drug_dispensing" ON public.drug_dispensing;
  -- payments
  DROP POLICY IF EXISTS "read_payments" ON public.payments;
  DROP POLICY IF EXISTS "insert_payments" ON public.payments;
  DROP POLICY IF EXISTS "update_payments" ON public.payments;
  DROP POLICY IF EXISTS "delete_payments" ON public.payments;
  -- glasses_inventory
  DROP POLICY IF EXISTS "read_glasses_inventory" ON public.glasses_inventory;
  DROP POLICY IF EXISTS "insert_glasses_inventory" ON public.glasses_inventory;
  DROP POLICY IF EXISTS "update_glasses_inventory" ON public.glasses_inventory;
  DROP POLICY IF EXISTS "delete_glasses_inventory" ON public.glasses_inventory;
  -- glasses_orders
  DROP POLICY IF EXISTS "read_glasses_orders" ON public.glasses_orders;
  DROP POLICY IF EXISTS "insert_glasses_orders" ON public.glasses_orders;
  DROP POLICY IF EXISTS "update_glasses_orders" ON public.glasses_orders;
  DROP POLICY IF EXISTS "delete_glasses_orders" ON public.glasses_orders;
  -- drugs
  DROP POLICY IF EXISTS "read_drugs" ON public.drugs;
  DROP POLICY IF EXISTS "insert_drugs" ON public.drugs;
  DROP POLICY IF EXISTS "update_drugs" ON public.drugs;
  DROP POLICY IF EXISTS "delete_drugs" ON public.drugs;
  -- profiles
  DROP POLICY IF EXISTS "profiles_select_all_active" ON public.profiles;
  DROP POLICY IF EXISTS "profiles_insert_trigger" ON public.profiles;
  DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
  DROP POLICY IF EXISTS "profiles_admin_manage" ON public.profiles;

  -- ========================
  -- Create clean simplified RLS policies
  -- ========================

  -- PROFILES TABLE POLICIES (critical for authentication)
  CREATE POLICY "profiles_select_all_active" ON public.profiles FOR SELECT TO authenticated USING (is_active = true);
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
  CREATE POLICY "delete_appointments" ON public.appointments FOR DELETE TO authenticated USING (get_user_role() IN ('frontdesk', 'admin'));

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
  CREATE POLICY "delete_drug_dispensing" ON public.drug_dispensing FOR DELETE TO authenticated USING (get_user_role() IN ('frontdesk', 'admin'));

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

  -- ========================
  -- Frontdesk operational CRUD alignment
  -- ========================

  -- Patients: allow frontdesk + admin delete to match UI workflow
  DROP POLICY IF EXISTS "delete_patients" ON public.patients;
  CREATE POLICY "delete_patients" ON public.patients
    FOR DELETE TO authenticated
    USING (get_user_role() IN ('frontdesk', 'admin'));

  -- Messages: users can update their own sent messages and mark messages addressed to them as read
  DROP POLICY IF EXISTS "update_messages" ON public.messages;
  CREATE POLICY "update_messages" ON public.messages
    FOR UPDATE TO authenticated
    USING (sender_id = auth.uid() OR receiver_id = auth.uid())
    WITH CHECK (sender_id = auth.uid() OR receiver_id = auth.uid());

  -- Notifications policies (RLS is enabled, so explicit policies are required)
  DROP POLICY IF EXISTS "read_own_notifications" ON public.notifications;
  DROP POLICY IF EXISTS "insert_own_notifications" ON public.notifications;
  DROP POLICY IF EXISTS "update_own_notifications" ON public.notifications;
  DROP POLICY IF EXISTS "delete_own_notifications" ON public.notifications;
  CREATE POLICY "read_own_notifications" ON public.notifications
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());
  CREATE POLICY "insert_own_notifications" ON public.notifications
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());
  CREATE POLICY "update_own_notifications" ON public.notifications
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
  CREATE POLICY "delete_own_notifications" ON public.notifications
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

  -- Outreach log policies
  DROP POLICY IF EXISTS "read_outreach_log" ON public.outreach_log;
  DROP POLICY IF EXISTS "insert_outreach_log" ON public.outreach_log;
  DROP POLICY IF EXISTS "update_outreach_log" ON public.outreach_log;
  DROP POLICY IF EXISTS "delete_outreach_log" ON public.outreach_log;
  CREATE POLICY "read_outreach_log" ON public.outreach_log
    FOR SELECT TO authenticated
    USING (true);
  CREATE POLICY "insert_outreach_log" ON public.outreach_log
    FOR INSERT TO authenticated
    WITH CHECK (get_user_role() IN ('frontdesk', 'admin', 'manager'));
  CREATE POLICY "update_outreach_log" ON public.outreach_log
    FOR UPDATE TO authenticated
    USING (get_user_role() IN ('frontdesk', 'admin', 'manager'))
    WITH CHECK (get_user_role() IN ('frontdesk', 'admin', 'manager'));
  CREATE POLICY "delete_outreach_log" ON public.outreach_log
    FOR DELETE TO authenticated
    USING (get_user_role() IN ('frontdesk', 'admin'));

  -- Inventory others policies
  DROP POLICY IF EXISTS "read_inventory_others" ON public.inventory_others;
  DROP POLICY IF EXISTS "insert_inventory_others" ON public.inventory_others;
  DROP POLICY IF EXISTS "update_inventory_others" ON public.inventory_others;
  DROP POLICY IF EXISTS "delete_inventory_others" ON public.inventory_others;
  CREATE POLICY "read_inventory_others" ON public.inventory_others
    FOR SELECT TO authenticated
    USING (true);
  CREATE POLICY "insert_inventory_others" ON public.inventory_others
    FOR INSERT TO authenticated
    WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));
  CREATE POLICY "update_inventory_others" ON public.inventory_others
    FOR UPDATE TO authenticated
    USING (get_user_role() IN ('frontdesk', 'admin'))
    WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));
  CREATE POLICY "delete_inventory_others" ON public.inventory_others
    FOR DELETE TO authenticated
    USING (get_user_role() = 'admin');

  -- Inventory dispensing policies
  DROP POLICY IF EXISTS "read_inventory_dispensing" ON public.inventory_dispensing;
  DROP POLICY IF EXISTS "insert_inventory_dispensing" ON public.inventory_dispensing;
  DROP POLICY IF EXISTS "update_inventory_dispensing" ON public.inventory_dispensing;
  DROP POLICY IF EXISTS "delete_inventory_dispensing" ON public.inventory_dispensing;
  CREATE POLICY "read_inventory_dispensing" ON public.inventory_dispensing
    FOR SELECT TO authenticated
    USING (true);
  CREATE POLICY "insert_inventory_dispensing" ON public.inventory_dispensing
    FOR INSERT TO authenticated
    WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));
  CREATE POLICY "update_inventory_dispensing" ON public.inventory_dispensing
    FOR UPDATE TO authenticated
    USING (get_user_role() IN ('frontdesk', 'admin'))
    WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));
  CREATE POLICY "delete_inventory_dispensing" ON public.inventory_dispensing
    FOR DELETE TO authenticated
    USING (get_user_role() IN ('frontdesk', 'admin'));

  -- Settings policies (shared settings page)
  DROP POLICY IF EXISTS "read_settings" ON public.settings;
  DROP POLICY IF EXISTS "write_settings" ON public.settings;
  DROP POLICY IF EXISTS "write_own_notification_settings" ON public.settings;
  CREATE POLICY "read_settings" ON public.settings
    FOR SELECT TO authenticated
    USING (true);
  CREATE POLICY "write_settings" ON public.settings
    FOR ALL TO authenticated
    USING (get_user_role() IN ('admin', 'manager'))
    WITH CHECK (get_user_role() IN ('admin', 'manager'));
  CREATE POLICY "write_own_notification_settings" ON public.settings
    FOR ALL TO authenticated
    USING (key LIKE auth.uid()::text || '\_%' ESCAPE '\')
    WITH CHECK (key LIKE auth.uid()::text || '\_%' ESCAPE '\');
