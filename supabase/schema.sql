INTO _exists;
IF NOT _exists THEN CREATE POLICY "All staff view drugs" ON public.drugs FOR
SELECT TO authenticated USING (TRUE);
END IF;
END $$;
DROP POLICY IF EXISTS "Assistant/admin manage drugs" ON public.drugs;
DO $$
DECLARE _exists bool;
BEGIN
SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'drugs'
      AND policyname = 'Frontdesk/admin manage drugs'
  ) INTO _exists;
IF NOT _exists THEN CREATE POLICY "Frontdesk/admin manage drugs" ON public.drugs FOR ALL TO authenticated USING (get_user_role() IN ('frontdesk', 'admin'));
END IF;
END $$;
-- ── Drug Dispensing Policies ────────────────────────────────────
DROP POLICY IF EXISTS "Assistant dispenses" ON public.drug_dispensing;
DO $$
DECLARE _exists bool;
BEGIN
SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'drug_dispensing'
      AND policyname = 'View dispensing'
  ) INTO _exists;
IF NOT _exists THEN CREATE POLICY "View dispensing" ON public.drug_dispensing FOR
SELECT TO authenticated USING (
    get_user_role() IN ('doctor', 'frontdesk', 'admin')
  );
END IF;
END $$;
DO $$
DECLARE _exists bool;
BEGIN
SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'drug_dispensing'
      AND policyname = 'Frontdesk/admin dispenses'
  ) INTO _exists;
IF NOT _exists THEN CREATE POLICY "Frontdesk/admin dispenses" ON public.drug_dispensing FOR
INSERT TO authenticated WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));
END IF;
END $$;
-- ── Glasses Policies ────────────────────────────────────────
DROP POLICY IF EXISTS "Assistant/admin manage glasses" ON public.glasses_inventory;
DROP POLICY IF EXISTS "Assistant/admin manage orders" ON public.glasses_orders;
DO $$
DECLARE _exists bool;
BEGIN
SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'glasses_inventory'
      AND policyname = 'All view glasses'
  ) INTO _exists;
IF NOT _exists THEN CREATE POLICY "All view glasses" ON public.glasses_inventory FOR
SELECT TO authenticated USING (TRUE);
END IF;
END $$;
DO $$
DECLARE _exists bool;
BEGIN
SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'glasses_inventory'
      AND policyname = 'Frontdesk/admin manage glasses'
  ) INTO _exists;
IF NOT _exists THEN CREATE POLICY "Frontdesk/admin manage glasses" ON public.glasses_inventory FOR ALL TO authenticated USING (get_user_role() IN ('frontdesk', 'admin'));
END IF;
END $$;
DO $$
DECLARE _exists bool;
BEGIN
SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'glasses_orders'
      AND policyname = 'All view orders'
  ) INTO _exists;
IF NOT _exists THEN CREATE POLICY "All view orders" ON public.glasses_orders FOR
SELECT TO authenticated USING (TRUE);
END IF;
END $$;
DO $$
DECLARE _exists bool;
BEGIN
SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'glasses_orders'
      AND policyname = 'Frontdesk/admin manage orders'
  ) INTO _exists;
IF NOT _exists THEN CREATE POLICY "Frontdesk/admin manage orders" ON public.glasses_orders FOR ALL TO authenticated USING (get_user_role() IN ('frontdesk', 'admin'));
END IF;
END $$;
-- ── Inventory Others Policies ────────────────────────────────────
DO $$
DECLARE _exists bool;
BEGIN
SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'inventory_others'
      AND policyname = 'All view inventory others'
  ) INTO _exists;
IF NOT _exists THEN CREATE POLICY "All view inventory others" ON public.inventory_others FOR
SELECT TO authenticated USING (TRUE);
END IF;
END $$;
DO $$
DECLARE _exists bool;
BEGIN
SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'inventory_others'
      AND policyname = 'Frontdesk/admin manage inventory others'
  ) INTO _exists;
IF NOT _exists THEN CREATE POLICY "Frontdesk/admin manage inventory others" ON public.inventory_others FOR ALL TO authenticated USING (get_user_role() IN ('frontdesk', 'admin'));
END IF;
END $$;
-- ── Payments Policies ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Assistant insert payments" ON public.payments;
DROP POLICY IF EXISTS "Accountant/admin manage payments" ON public.payments;
DO $$
DECLARE _exists bool;
BEGIN
SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'payments'
      AND policyname = 'Finance view payments'
  ) INTO _exists;
IF NOT _exists THEN CREATE POLICY "Finance view payments" ON public.payments FOR
SELECT TO authenticated USING (
    get_user_role() IN ('frontdesk', 'admin', 'manager')
  );
END IF;
END $$;
DO $$
DECLARE _exists bool;
BEGIN
SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'payments'
      AND policyname = 'Frontdesk/admin insert payments'
  ) INTO _exists;
IF NOT _exists THEN CREATE POLICY "Frontdesk/admin insert payments" ON public.payments FOR
INSERT TO authenticated WITH CHECK (
    get_user_role() IN ('frontdesk', 'admin', 'manager')
  );
END IF;
END $$;
DO $$
DECLARE _exists bool;
BEGIN
SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'payments'
      AND policyname = 'Admin manage payments'
  ) INTO _exists;
IF NOT _exists THEN CREATE POLICY "Admin manage payments" ON public.payments FOR ALL TO authenticated USING (get_user_role() = 'admin');
END IF;
END $$;
-- ── Messages Policies ──────────────────────────────────────
DO $$
DECLARE _exists bool;
BEGIN
SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'messages'
      AND policyname = 'Own messages'
  ) INTO _exists;
IF NOT _exists THEN CREATE POLICY "Own messages" ON public.messages FOR
SELECT TO authenticated USING (
    sender_id = auth.uid()
    OR receiver_id = auth.uid()
  );
END IF;
END $$;
DO $$
DECLARE _exists bool;
BEGIN
SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'messages'
      AND policyname = 'Send messages'
  ) INTO _exists;
IF NOT _exists THEN CREATE POLICY "Send messages" ON public.messages FOR
INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
END IF;
END $$;
DO $$
DECLARE _exists bool;
BEGIN
SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'messages'
      AND policyname = 'Edit own messages'
  ) INTO _exists;
IF NOT _exists THEN CREATE POLICY "Edit own messages" ON public.messages FOR
UPDATE TO authenticated USING (sender_id = auth.uid());
END IF;
END $$;
DO $$
DECLARE _exists bool;
BEGIN
SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'messages'
      AND policyname = 'Delete own messages'
  ) INTO _exists;
IF NOT _exists THEN CREATE POLICY "Delete own messages" ON public.messages FOR DELETE TO authenticated USING (sender_id = auth.uid());
END IF;
END $$;
-- ── Audit Logs Policies ─────────────────────────────────
-- Drop old restrictive policy if exists (migration fix)
DROP POLICY IF EXISTS "Admin views audit" ON public.audit_logs;
DO $$
DECLARE _exists bool;
BEGIN
SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'audit_logs'
      AND policyname = 'Admin and manager view audit'
  ) INTO _exists;
IF NOT _exists THEN CREATE POLICY "Admin and manager view audit" ON public.audit_logs FOR
SELECT TO authenticated USING (get_user_role() IN ('admin', 'manager'));
END IF;
END $$;
DO $$
DECLARE _exists bool;
BEGIN
SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'audit_logs'
      AND policyname = 'Append audit'
  ) INTO _exists;
IF NOT _exists THEN CREATE POLICY "Append audit" ON public.audit_logs FOR
INSERT TO authenticated WITH CHECK (TRUE);
END IF;
END $$;
-- ── Outreach Policies ────────────────────────────────────────────
DROP POLICY IF EXISTS "Assistant/admin outreach" ON public.outreach_log;
DO $$
DECLARE _exists bool;
BEGIN
SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'outreach_log'
      AND policyname = 'Frontdesk/admin outreach'
  ) INTO _exists;
IF NOT _exists THEN CREATE POLICY "Frontdesk/admin outreach" ON public.outreach_log FOR ALL TO authenticated USING (get_user_role() IN ('frontdesk', 'admin'));
END IF;
END $$;
-- ── Settings Policies ───────────────────────────────────────
DROP POLICY IF EXISTS "Anyone read settings" ON public.settings;
DROP POLICY IF EXISTS "Users read own settings" ON public.settings;
DROP POLICY IF EXISTS "Users manage own settings" ON public.settings;
DROP POLICY IF EXISTS "Admin manage settings" ON public.settings;
DO $$
DECLARE _exists bool;
BEGIN
SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'settings'
      AND policyname = 'Authenticated read settings'
  ) INTO _exists;
IF NOT _exists THEN CREATE POLICY "Authenticated read settings" ON public.settings FOR
SELECT TO authenticated USING (TRUE);
END IF;
END $$;
DO $$
DECLARE _exists bool;
BEGIN
SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'settings'
      AND policyname = 'Admin manage settings'
  ) INTO _exists;
IF NOT _exists THEN CREATE POLICY "Admin manage settings" ON public.settings FOR ALL TO authenticated USING (get_user_role() = 'admin');
END IF;
END $$;
-- ── Push Subscriptions Policies ──────────────────────────
DO $$
DECLARE _exists bool;
BEGIN
SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'push_subscriptions'
      AND policyname = 'Own push sub'
  ) INTO _exists;
IF NOT _exists THEN CREATE POLICY "Own push sub" ON public.push_subscriptions FOR ALL TO authenticated USING (user_id = auth.uid());
END IF;
END $$;
-- ══════════════════════════════════════════════════════════════
-- 9. FOREIGN KEY CASCADE FIXES — Run these in Supabase SQL editor
-- ══════════════════════════════════════════════════════════════
-- These fix patient deletion when patient has linked records
-- Fix: Add ON DELETE CASCADE to drug_dispensing.patient_id
ALTER TABLE public.drug_dispensing DROP CONSTRAINT IF EXISTS drug_dispensing_patient_id_fkey;
ALTER TABLE public.drug_dispensing
ADD CONSTRAINT drug_dispensing_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;
-- Fix: Add ON DELETE CASCADE to glasses_orders.patient_id
ALTER TABLE public.glasses_orders DROP CONSTRAINT IF EXISTS glasses_orders_patient_id_fkey;
ALTER TABLE public.glasses_orders
ADD CONSTRAINT glasses_orders_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;
-- Fix: Add ON DELETE CASCADE to payments.patient_id
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_patient_id_fkey;
ALTER TABLE public.payments
ADD CONSTRAINT payments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;
-- Fix: Add ON DELETE CASCADE to outreach_log.patient_id
ALTER TABLE public.outreach_log DROP CONSTRAINT IF EXISTS outreach_log_patient_id_fkey;
ALTER TABLE public.outreach_log
ADD CONSTRAINT outreach_log_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;
-- Fix: Add ON DELETE CASCADE to messages.patient_id (if messages has patient_id FK)
DO $$ BEGIN
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_patient_id_fkey;
EXCEPTION
WHEN OTHERS THEN NULL;
END $$;