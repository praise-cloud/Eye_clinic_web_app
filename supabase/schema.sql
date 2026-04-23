-- ============================================================
-- Eye Clinic PWA — Full Database Schema
-- Run this in Supabase SQL Editor (replaces old schema)
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── PROFILES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('doctor','assistant','admin','accountant')),
  phone       TEXT,
  avatar_url  TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'assistant')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── PATIENTS ─────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS patient_number_seq START 1;

CREATE TABLE IF NOT EXISTS public.patients (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_number      TEXT UNIQUE NOT NULL,
  first_name          TEXT NOT NULL,
  last_name           TEXT NOT NULL,
  date_of_birth       DATE,
  gender              TEXT CHECK (gender IN ('male','female','other')),
  phone               TEXT,
  email               TEXT,
  address             TEXT,
  occupation          TEXT,
  next_of_kin_name    TEXT,
  next_of_kin_phone   TEXT,
  blood_group         TEXT,
  allergies           TEXT,
  subscription_type   TEXT CHECK (subscription_type IN ('none','basic','standard','premium')) DEFAULT 'none',
  subscription_start  DATE,
  subscription_end    DATE,
  registered_by       UUID REFERENCES public.profiles(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION generate_patient_number() RETURNS TRIGGER AS $$
BEGIN
  NEW.patient_number = 'P-' || LPAD(nextval('patient_number_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_patient_number ON public.patients;
CREATE TRIGGER set_patient_number
  BEFORE INSERT ON public.patients
  FOR EACH ROW EXECUTE FUNCTION generate_patient_number();

-- ── APPOINTMENTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.appointments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id        UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id         UUID NOT NULL REFERENCES public.profiles(id),
  requested_by      UUID REFERENCES public.profiles(id),
  scheduled_at      TIMESTAMPTZ NOT NULL,
  appointment_type  TEXT DEFAULT 'checkup' CHECK (appointment_type IN ('checkup','follow_up','new_consultation','glasses_fitting','emergency')),
  status            TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','arrived','in_progress','completed','cancelled','no_show')),
  notes             TEXT,
  reminder_sent     BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── CASE NOTES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.case_notes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id       UUID NOT NULL REFERENCES public.profiles(id),
  appointment_id  UUID REFERENCES public.appointments(id),
  chief_complaint TEXT,
  history         TEXT,
  examination     TEXT,
  diagnosis       TEXT,
  treatment_plan  TEXT,
  follow_up_date  DATE,
  is_encrypted    BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── PRESCRIPTIONS (GLASSES) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id    UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id     UUID NOT NULL REFERENCES public.profiles(id),
  case_note_id  UUID REFERENCES public.case_notes(id),
  re_sphere     NUMERIC(5,2), re_cylinder NUMERIC(5,2), re_axis INTEGER, re_add NUMERIC(5,2), re_va TEXT,
  le_sphere     NUMERIC(5,2), le_cylinder NUMERIC(5,2), le_axis INTEGER, le_add NUMERIC(5,2), le_va TEXT,
  pd            NUMERIC(5,1),
  lens_type     TEXT CHECK (lens_type IN ('single_vision','bifocal','progressive','reading')),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── DRUGS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.drugs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  generic_name    TEXT,
  category        TEXT,
  unit            TEXT NOT NULL DEFAULT 'piece',
  quantity        INTEGER NOT NULL DEFAULT 0,
  reorder_level   INTEGER DEFAULT 10,
  purchase_price  NUMERIC(12,2),
  selling_price   NUMERIC(12,2) NOT NULL,
  supplier        TEXT,
  expiry_date     DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── DRUG DISPENSING ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.drug_dispensing (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id        UUID NOT NULL REFERENCES public.patients(id),
  drug_id           UUID NOT NULL REFERENCES public.drugs(id),
  dispensed_by      UUID NOT NULL REFERENCES public.profiles(id),
  prescription_note TEXT,
  quantity          INTEGER NOT NULL,
  unit_price        NUMERIC(12,2) NOT NULL,
  total_price       NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  dispensed_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION reduce_drug_stock() RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.drugs SET quantity = quantity - NEW.quantity, updated_at = NOW() WHERE id = NEW.drug_id;
  IF (SELECT quantity FROM public.drugs WHERE id = NEW.drug_id) < 0 THEN
    RAISE EXCEPTION 'Insufficient stock for drug %', NEW.drug_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_drug_dispensed ON public.drug_dispensing;
CREATE TRIGGER on_drug_dispensed
  AFTER INSERT ON public.drug_dispensing
  FOR EACH ROW EXECUTE FUNCTION reduce_drug_stock();

-- ── GLASSES INVENTORY ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.glasses_inventory (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  frame_name      TEXT NOT NULL,
  frame_brand     TEXT,
  frame_code      TEXT UNIQUE,
  color           TEXT,
  material        TEXT,
  gender          TEXT CHECK (gender IN ('male','female','unisex')),
  quantity        INTEGER NOT NULL DEFAULT 0,
  reorder_level   INTEGER DEFAULT 5,
  purchase_price  NUMERIC(12,2),
  selling_price   NUMERIC(12,2) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── GLASSES ORDERS ───────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS glasses_order_seq START 1;

CREATE TABLE IF NOT EXISTS public.glasses_orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number    TEXT UNIQUE NOT NULL,
  patient_id      UUID NOT NULL REFERENCES public.patients(id),
  prescription_id UUID REFERENCES public.prescriptions(id),
  frame_id        UUID REFERENCES public.glasses_inventory(id),
  lens_type       TEXT,
  lens_coating    TEXT,
  frame_price     NUMERIC(12,2),
  lens_price      NUMERIC(12,2),
  total_price     NUMERIC(12,2),
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_lab','ready','dispensed','cancelled')),
  deposit_paid    NUMERIC(12,2) DEFAULT 0,
  created_by      UUID REFERENCES public.profiles(id),
  dispensed_by    UUID REFERENCES public.profiles(id),
  estimated_ready DATE,
  dispensed_at    TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION generate_order_number() RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number = 'GO-' || LPAD(nextval('glasses_order_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_order_number ON public.glasses_orders;
CREATE TRIGGER set_order_number
  BEFORE INSERT ON public.glasses_orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- ── PAYMENTS ─────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS receipt_number_seq START 1;

CREATE TABLE IF NOT EXISTS public.payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_number  TEXT UNIQUE NOT NULL,
  patient_id      UUID NOT NULL REFERENCES public.patients(id),
  payment_type    TEXT NOT NULL CHECK (payment_type IN ('consultation','drug','glasses_deposit','glasses_balance','subscription','other')),
  reference_id    UUID,
  amount          NUMERIC(12,2) NOT NULL,
  payment_method  TEXT CHECK (payment_method IN ('cash','transfer','pos','other')),
  received_by     UUID REFERENCES public.profiles(id),
  notes           TEXT,
  paid_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION generate_receipt_number() RETURNS TRIGGER AS $$
BEGIN
  NEW.receipt_number = 'RCP-' || LPAD(nextval('receipt_number_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_receipt_number ON public.payments;
CREATE TRIGGER set_receipt_number
  BEFORE INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION generate_receipt_number();

-- ── MESSAGES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id   UUID NOT NULL REFERENCES public.profiles(id),
  receiver_id UUID NOT NULL REFERENCES public.profiles(id),
  content     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON public.messages(LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id), created_at DESC);

-- ── OUTREACH LOG ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.outreach_log (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id        UUID NOT NULL REFERENCES public.patients(id),
  sent_by           UUID NOT NULL REFERENCES public.profiles(id),
  channel           TEXT CHECK (channel IN ('sms','email','whatsapp')),
  message_template  TEXT,
  message_body      TEXT,
  status            TEXT CHECK (status IN ('sent','failed','delivered')),
  sent_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ── PUSH SUBSCRIPTIONS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ── AUDIT LOGS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.profiles(id),
  action      TEXT NOT NULL,
  table_name  TEXT NOT NULL,
  record_id   UUID,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── VIEWS ────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.daily_summary AS
SELECT
  DATE(paid_at) AS summary_date,
  COUNT(DISTINCT patient_id) FILTER (WHERE payment_type = 'consultation') AS new_patients,
  COUNT(DISTINCT patient_id) AS returning_patients,
  COALESCE(SUM(amount) FILTER (WHERE payment_type = 'drug'), 0) AS drug_revenue,
  COALESCE(SUM(amount) FILTER (WHERE payment_type IN ('glasses_deposit','glasses_balance')), 0) AS glasses_revenue,
  COALESCE(SUM(amount) FILTER (WHERE payment_type = 'consultation'), 0) AS consultation_revenue,
  COALESCE(SUM(amount) FILTER (WHERE payment_type = 'subscription'), 0) AS subscription_revenue,
  COALESCE(SUM(amount), 0) AS total_revenue
FROM public.payments
GROUP BY DATE(paid_at)
ORDER BY summary_date DESC;

CREATE OR REPLACE VIEW public.low_stock_drugs AS
SELECT id, name, quantity, reorder_level, selling_price
FROM public.drugs WHERE quantity <= reorder_level;

CREATE OR REPLACE VIEW public.low_stock_glasses AS
SELECT id, frame_name, frame_code, quantity, reorder_level, selling_price
FROM public.glasses_inventory WHERE quantity <= reorder_level;

CREATE OR REPLACE VIEW public.expiring_subscriptions AS
SELECT p.id, p.patient_number, p.first_name, p.last_name, p.phone, p.email,
  p.subscription_type, p.subscription_end,
  (p.subscription_end - CURRENT_DATE) AS days_remaining
FROM public.patients p
WHERE p.subscription_end IS NOT NULL
  AND p.subscription_end BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
ORDER BY p.subscription_end ASC;

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drug_dispensing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glasses_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glasses_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_user_role() RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Profiles
CREATE POLICY "Staff read profiles" ON public.profiles FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Admin manages profiles" ON public.profiles FOR ALL TO authenticated USING (get_user_role() = 'admin');

-- Patients
CREATE POLICY "All staff view patients" ON public.patients FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Assistant/admin create patients" ON public.patients FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('assistant','admin'));
CREATE POLICY "Assistant/admin update patients" ON public.patients FOR UPDATE TO authenticated USING (get_user_role() IN ('assistant','admin'));
CREATE POLICY "Assistant/admin delete patients" ON public.patients FOR DELETE TO authenticated USING (get_user_role() IN ('assistant','admin'));

-- Appointments
CREATE POLICY "All staff view appointments" ON public.appointments FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Staff manage appointments" ON public.appointments FOR ALL TO authenticated USING (get_user_role() IN ('doctor','assistant','admin'));

-- Case Notes
CREATE POLICY "Doctors/admin view notes" ON public.case_notes FOR SELECT TO authenticated USING (get_user_role() IN ('doctor','admin'));
CREATE POLICY "Doctors create notes" ON public.case_notes FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'doctor' AND doctor_id = auth.uid());
CREATE POLICY "Doctors update own notes" ON public.case_notes FOR UPDATE TO authenticated USING (get_user_role() = 'doctor' AND doctor_id = auth.uid());

-- Drugs
CREATE POLICY "All staff view drugs" ON public.drugs FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Assistant/admin manage drugs" ON public.drugs FOR ALL TO authenticated USING (get_user_role() IN ('assistant','admin'));

-- Drug Dispensing
CREATE POLICY "View dispensing" ON public.drug_dispensing FOR SELECT TO authenticated USING (get_user_role() IN ('doctor','assistant','admin','accountant'));
CREATE POLICY "Assistant dispenses" ON public.drug_dispensing FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('assistant','admin'));

-- Glasses
CREATE POLICY "All view glasses" ON public.glasses_inventory FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Assistant/admin manage glasses" ON public.glasses_inventory FOR ALL TO authenticated USING (get_user_role() IN ('assistant','admin'));
CREATE POLICY "All view orders" ON public.glasses_orders FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Assistant/admin manage orders" ON public.glasses_orders FOR ALL TO authenticated USING (get_user_role() IN ('assistant','admin'));

-- Payments
CREATE POLICY "Finance view payments" ON public.payments FOR SELECT TO authenticated USING (get_user_role() IN ('assistant','accountant','admin'));
CREATE POLICY "Assistant insert payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('assistant','admin'));
CREATE POLICY "Accountant/admin manage payments" ON public.payments FOR ALL TO authenticated USING (get_user_role() IN ('accountant','admin'));

-- Messages
CREATE POLICY "Own messages" ON public.messages FOR SELECT TO authenticated USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "Send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());

-- Audit Logs
CREATE POLICY "Admin views audit" ON public.audit_logs FOR SELECT TO authenticated USING (get_user_role() = 'admin');
CREATE POLICY "Append audit" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (TRUE);

-- Outreach
CREATE POLICY "Assistant/admin outreach" ON public.outreach_log FOR ALL TO authenticated USING (get_user_role() IN ('assistant','admin'));

-- Push subscriptions
CREATE POLICY "Own push sub" ON public.push_subscriptions FOR ALL TO authenticated USING (user_id = auth.uid());

-- ── REALTIME ─────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.drug_dispensing;
ALTER PUBLICATION supabase_realtime ADD TABLE public.glasses_orders;
