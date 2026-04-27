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
  role        TEXT NOT NULL,
  phone       TEXT,
  avatar_url  TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Drop constraint FIRST before updating roles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Update existing roles (normalize and map legacy roles)
UPDATE public.profiles
SET role = CASE
  WHEN lower(btrim(role)) = 'assistant' THEN 'frontdesk'
  WHEN lower(btrim(role)) = 'accountant' THEN 'admin'
  ELSE lower(btrim(role))
END
WHERE lower(btrim(role)) IN ('assistant', 'accountant')
   OR role <> lower(btrim(role));

-- Add the new constraint with correct roles
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (lower(btrim(role)) IN ('doctor', 'frontdesk', 'admin', 'manager'));

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_role TEXT;
BEGIN
  normalized_role := lower(btrim(COALESCE(NEW.raw_user_meta_data->>'role', 'frontdesk')));

  IF normalized_role = 'assistant' THEN
    normalized_role := 'frontdesk';
  ELSIF normalized_role = 'accountant' THEN
    normalized_role := 'admin';
  ELSIF normalized_role NOT IN ('doctor', 'frontdesk', 'admin', 'manager') THEN
    normalized_role := 'frontdesk';
  END IF;

  INSERT INTO public.profiles (
    id,
    full_name,
    role,
    phone,
    is_active
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    normalized_role,
    NEW.raw_user_meta_data->>'phone',
    TRUE
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    is_active = TRUE,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── get_user_role function ───────────────────────────────────
CREATE OR REPLACE FUNCTION get_user_role() RETURNS TEXT AS $$
  SELECT lower(btrim(role)) FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

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
  cvf_attachment_url TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Add cvf_attachment_url column if it doesn't exist (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'case_notes' AND column_name = 'cvf_attachment_url'
  ) THEN
    ALTER TABLE public.case_notes ADD COLUMN cvf_attachment_url TEXT;
  END IF;
END $$;

-- ── STORAGE BUCKET FOR CVF ATTACHMENTS ────────────────────────
-- Note: Only run if storage buckets table exists and has the expected columns
-- The storage schema varies by Supabase version
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'storage' AND table_name = 'buckets' AND column_name = 'name'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('cvf-attachments', 'cvf-attachments', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

DROP POLICY IF EXISTS "Anyone can view cvf-attachments" ON storage.objects;
CREATE POLICY "Anyone can view cvf-attachments"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'cvf-attachments' );

DROP POLICY IF EXISTS "Doctors can upload cvf-attachments" ON storage.objects;
CREATE POLICY "Doctors can upload cvf-attachments"
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'cvf-attachments' );

DROP POLICY IF EXISTS "Admins can upload cvf-attachments" ON storage.objects;
CREATE POLICY "Admins can upload cvf-attachments"
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'cvf-attachments' );

-- ── STORAGE BUCKET FOR CHAT FILES ────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'storage' AND table_name = 'buckets' AND column_name = 'name'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('files', 'files', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'])
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

DROP POLICY IF EXISTS "Anyone can view files" ON storage.objects;
CREATE POLICY "Anyone can view files"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'files' );

DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
CREATE POLICY "Authenticated users can upload files"
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'files' );

DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
CREATE POLICY "Users can update own files"
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'files' );

DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'files' );

-- ── PRESCRIPTIONS (GLASSES) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id    UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id     UUID NOT NULL REFERENCES public.profiles(id),
  case_note_id  UUID REFERENCES public.case_notes(id),
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'dispensed')),
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
  patient_id        UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
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
  gender          TEXT CHECK (gender IN ('male','female','other')),
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
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id         UUID NOT NULL REFERENCES public.profiles(id),
  receiver_id       UUID NOT NULL REFERENCES public.profiles(id),
  content           TEXT NOT NULL,
  is_read           BOOLEAN DEFAULT FALSE,
  read_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ,
  attachment_type   TEXT CHECK (attachment_type IN ('image', 'document')),
  attachment_url    TEXT,
  attachment_name   TEXT
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON public.messages(LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id), created_at DESC);

-- ── OUTREACH LOG ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.outreach_log (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id        UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  sent_by           UUID NOT NULL REFERENCES public.profiles(id),
  channel           TEXT CHECK (channel IN ('sms','email','whatsapp')),
  message_template  TEXT,
  message_body      TEXT,
  status            TEXT CHECK (status IN ('sent','failed','delivered')),
  sent_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ── SETTINGS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settings_key ON public.settings(key);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Default settings (idempotent) - Replace these values in Settings page
INSERT INTO public.settings (key, value) VALUES
    ('clinic_name', 'Your Clinic Name'),
    ('clinic_email', 'contact@yourclinic.com'),
    ('clinic_phone', '+234'),
    ('clinic_address', '')
ON CONFLICT (key) DO NOTHING;

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

-- ── RLS Enable (idempotent — safe to re-run) ────────────────
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

-- Note: REALTIME tables already configured in Supabase dashboard
-- Skip this section - tables already in publication if you have realtime enabled

-- ══════════════════════════════════════════════════════════════
-- 8. MIGRATION FIXES — Run these in Supabase SQL editor
-- ══════════════════════════════════════════════════════════════
-- These are IDEMPOTENT — safe to run even if they already exist

-- ── Profiles Policies ──────────────────────────────────────────────
DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Profile insert during signup') INTO _exists;
  IF NOT _exists THEN CREATE POLICY "Profile insert during signup" ON public.profiles FOR INSERT WITH CHECK (TRUE); END IF;
END $$;

DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Staff read profiles') INTO _exists;
  IF NOT _exists THEN CREATE POLICY "Staff read profiles" ON public.profiles FOR SELECT TO authenticated USING (TRUE); END IF;
END $$;

DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Own profile update') INTO _exists;
  IF NOT _exists THEN CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()); END IF;
END $$;

DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Admin manages profiles') INTO _exists;
  IF NOT _exists THEN CREATE POLICY "Admin manages profiles" ON public.profiles FOR ALL TO authenticated USING (get_user_role() = 'admin'); END IF;
END $$;

-- Manager-specific: Own profile update
DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Manager update own profile') INTO _exists;
  IF NOT _exists THEN CREATE POLICY "Manager update own profile" ON public.profiles FOR UPDATE TO authenticated USING (get_user_role() = 'manager' AND id = auth.uid()); END IF;
END $$;

-- ── Patients Policies ─────────────────────────────────────
DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='patients' AND policyname='All staff view patients') INTO _exists;
  IF NOT _exists THEN CREATE POLICY "All staff view patients" ON public.patients FOR SELECT TO authenticated USING (TRUE); END IF;
END $$;

DROP POLICY IF EXISTS "Frontdesk/admin create patients" ON public.patients;
DROP POLICY IF EXISTS "Frontdesk/admin update patients" ON public.patients;
DROP POLICY IF EXISTS "Frontdesk/admin delete patients" ON public.patients;

DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='patients' AND policyname='Frontdesk/admin create patients') INTO _exists;
  IF NOT _exists THEN CREATE POLICY "Frontdesk/admin create patients" ON public.patients FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('frontdesk', 'admin', 'manager')); END IF;
END $$;

DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='patients' AND policyname='Frontdesk/admin update patients') INTO _exists;
  IF NOT _exists THEN CREATE POLICY "Frontdesk/admin update patients" ON public.patients FOR UPDATE TO authenticated USING (get_user_role() IN ('frontdesk', 'admin', 'manager')); END IF;
END $$;

DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='patients' AND policyname='Frontdesk/admin delete patients') INTO _exists;
  IF NOT _exists THEN CREATE POLICY "Frontdesk/admin delete patients" ON public.patients FOR DELETE TO authenticated USING (get_user_role() IN ('frontdesk', 'admin', 'manager')); END IF;
END $$;

-- ── Appointments Policies ────────────────────────────────────
DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='appointments' AND policyname='All staff view appointments') INTO _exists;
  IF NOT _exists THEN CREATE POLICY "All staff view appointments" ON public.appointments FOR SELECT TO authenticated USING (TRUE); END IF;
END $$;

DROP POLICY IF EXISTS "Staff manage appointments" ON public.appointments;

DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='appointments' AND policyname='Staff manage appointments') INTO _exists;
  IF NOT _exists THEN CREATE POLICY "Staff manage appointments" ON public.appointments FOR ALL TO authenticated USING (get_user_role() IN ('doctor', 'frontdesk', 'admin', 'manager')); END IF;
END $$;

-- ── Case Notes Policies ───────────────────────────────────────
DROP POLICY IF EXISTS "Doctors/admin view notes" ON public.case_notes;
DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='case_notes' AND policyname='Doctors/admin view notes') INTO _exists;
  IF NOT _exists THEN CREATE POLICY "Doctors/admin view notes" ON public.case_notes FOR SELECT TO authenticated USING (get_user_role() IN ('doctor', 'admin', 'manager')); END IF;
END $$;

DROP POLICY IF EXISTS "Doctors create notes" ON public.case_notes;
DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='case_notes' AND policyname='Doctors create notes') INTO _exists;
  IF NOT _exists THEN CREATE POLICY "Doctors create notes" ON public.case_notes FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'doctor' AND doctor_id = auth.uid()); END IF;
END $$;

DROP POLICY IF EXISTS "Doctors update own notes" ON public.case_notes;
DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='case_notes' AND policyname='Doctors update own notes') INTO _exists;
  IF NOT _exists THEN CREATE POLICY "Doctors update own notes" ON public.case_notes FOR UPDATE TO authenticated USING (get_user_role() = 'doctor' AND doctor_id = auth.uid()); END IF;
END $$;

-- ── Drugs Policies ────────────────────────────────────────────
DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='drugs' AND policyname='All staff view drugs') INTO _exists;
  IF NOT _exists THEN CREATE POLICY "All staff view drugs" ON public.drugs FOR SELECT TO authenticated USING (TRUE); END IF;
END $$;

DROP POLICY IF EXISTS "Assistant/admin manage drugs" ON public.drugs;

DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='drugs' AND policyname='Frontdesk/admin manage drugs') INTO _exists;
  IF NOT _exists THEN CREATE POLICY "Frontdesk/admin manage drugs" ON public.drugs FOR ALL TO authenticated USING (get_user_role() IN ('frontdesk','admin')); END IF;
END $$;

-- ── Drug Dispensing Policies ────────────────────────────────────
DROP POLICY IF EXISTS "Assistant dispenses" ON public.drug_dispensing;

DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='drug_dispensing' AND policyname='View dispensing') INTO _exists;
  IF NOT _exists THEN CREATE POLICY "View dispensing" ON public.drug_dispensing FOR SELECT TO authenticated USING (get_user_role() IN ('doctor','frontdesk','admin')); END IF;
END $$;

DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='drug_dispensing' AND policyname='Frontdesk/admin dispenses') INTO _exists;
  IF NOT _exists THEN CREATE POLICY "Frontdesk/admin dispenses" ON public.drug_dispensing FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('frontdesk','admin')); END IF;
END $$;

-- ── Glasses Policies ────────────────────────────────────────
DROP POLICY IF EXISTS "Assistant/admin manage glasses" ON public.glasses_inventory;
DROP POLICY IF EXISTS "Assistant/admin manage orders" ON public.glasses_orders;

DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='glasses_inventory' AND policyname='All view glasses') INTO _exists;
  IF NOT _exists THEN CREATE POLICY "All view glasses" ON public.glasses_inventory FOR SELECT TO authenticated USING (TRUE); END IF;
END $$;

DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='glasses_inventory' AND policyname='Frontdesk/admin manage glasses') INTO _exists;
  IF NOT _exists THEN CREATE POLICY "Frontdesk/admin manage glasses" ON public.glasses_inventory FOR ALL TO authenticated USING (get_user_role() IN ('frontdesk','admin')); END IF;
END $$;

DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='glasses_orders' AND policyname='All view orders') INTO _exists;
  IF NOT _exists THEN CREATE POLICY "All view orders" ON public.glasses_orders FOR SELECT TO authenticated USING (TRUE); END IF;
END $$;

DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='glasses_orders' AND policyname='Frontdesk/admin manage orders') INTO _exists;
  IF NOT _exists THEN CREATE POLICY "Frontdesk/admin manage orders" ON public.glasses_orders FOR ALL TO authenticated USING (get_user_role() IN ('frontdesk','admin')); END IF;
END $$;

-- ── Payments Policies ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Assistant insert payments" ON public.payments;
DROP POLICY IF EXISTS "Accountant/admin manage payments" ON public.payments;

DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payments' AND policyname='Finance view payments') INTO _exists;
  IF NOT _exists THEN CREATE POLICY "Finance view payments" ON public.payments FOR SELECT TO authenticated USING (get_user_role() IN ('frontdesk', 'admin', 'manager')); END IF;
END $$;

DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payments' AND policyname='Frontdesk/admin insert payments') INTO _exists;
  IF NOT _exists THEN CREATE POLICY "Frontdesk/admin insert payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('frontdesk', 'admin', 'manager')); END IF;
END $$;

DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payments' AND policyname='Admin manage payments') INTO _exists;
  IF NOT _exists THEN CREATE POLICY "Admin manage payments" ON public.payments FOR ALL TO authenticated USING (get_user_role() = 'admin'); END IF;
END $$;

-- ── Messages Policies ──────────────────────────────────────
DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='messages' AND policyname='Own messages') INTO _exists;
  IF NOT _exists THEN CREATE POLICY "Own messages" ON public.messages FOR SELECT TO authenticated USING (sender_id = auth.uid() OR receiver_id = auth.uid()); END IF;
END $$;

DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='messages' AND policyname='Send messages') INTO _exists;
  IF NOT _exists THEN CREATE POLICY "Send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid()); END IF;
END $$;

DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='messages' AND policyname='Edit own messages') INTO _exists;
  IF NOT _exists THEN CREATE POLICY "Edit own messages" ON public.messages FOR UPDATE TO authenticated USING (sender_id = auth.uid()); END IF;
END $$;

DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='messages' AND policyname='Delete own messages') INTO _exists;
  IF NOT _exists THEN CREATE POLICY "Delete own messages" ON public.messages FOR DELETE TO authenticated USING (sender_id = auth.uid()); END IF;
END $$;

-- ── Audit Logs Policies ─────────────────────────────────
DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='audit_logs' AND policyname='Admin views audit') INTO _exists;
  IF NOT _exists THEN CREATE POLICY "Admin views audit" ON public.audit_logs FOR SELECT TO authenticated USING (get_user_role() = 'admin'); END IF;
END $$;

DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='audit_logs' AND policyname='Append audit') INTO _exists;
  IF NOT _exists THEN CREATE POLICY "Append audit" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (TRUE); END IF;
END $$;

-- ── Outreach Policies ────────────────────────────────────────────
DROP POLICY IF EXISTS "Assistant/admin outreach" ON public.outreach_log;

DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='outreach_log' AND policyname='Frontdesk/admin outreach') INTO _exists;
  IF NOT _exists THEN CREATE POLICY "Frontdesk/admin outreach" ON public.outreach_log FOR ALL TO authenticated USING (get_user_role() IN ('frontdesk','admin')); END IF;
END $$;

-- ── Settings Policies ───────────────────────────────────────
DROP POLICY IF EXISTS "Anyone read settings" ON public.settings;
DROP POLICY IF EXISTS "Users read own settings" ON public.settings;
DROP POLICY IF EXISTS "Users manage own settings" ON public.settings;
DROP POLICY IF EXISTS "Admin manage settings" ON public.settings;

DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='settings' AND policyname='Authenticated read settings') INTO _exists;
  IF NOT _exists THEN CREATE POLICY "Authenticated read settings" ON public.settings FOR SELECT TO authenticated USING (TRUE); END IF;
END $$;

DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='settings' AND policyname='Admin manage settings') INTO _exists;
  IF NOT _exists THEN CREATE POLICY "Admin manage settings" ON public.settings FOR ALL TO authenticated USING (get_user_role() = 'admin'); END IF;
END $$;

-- ── Push Subscriptions Policies ──────────────────────────
DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='push_subscriptions' AND policyname='Own push sub') INTO _exists;
  IF NOT _exists THEN CREATE POLICY "Own push sub" ON public.push_subscriptions FOR ALL TO authenticated USING (user_id = auth.uid()); END IF;
END $$;

-- ══════════════════════════════════════════════════════════════
-- 9. FOREIGN KEY CASCADE FIXES — Run these in Supabase SQL editor
-- ══════════════════════════════════════════════════════════════
-- These fix patient deletion when patient has linked records

-- Fix: Add ON DELETE CASCADE to drug_dispensing.patient_id
ALTER TABLE public.drug_dispensing DROP CONSTRAINT IF EXISTS drug_dispensing_patient_id_fkey;
ALTER TABLE public.drug_dispensing ADD CONSTRAINT drug_dispensing_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;

-- Fix: Add ON DELETE CASCADE to glasses_orders.patient_id
ALTER TABLE public.glasses_orders DROP CONSTRAINT IF EXISTS glasses_orders_patient_id_fkey;
ALTER TABLE public.glasses_orders ADD CONSTRAINT glasses_orders_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;

-- Fix: Add ON DELETE CASCADE to payments.patient_id
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_patient_id_fkey;
ALTER TABLE public.payments ADD CONSTRAINT payments_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;

-- Fix: Add ON DELETE CASCADE to outreach_log.patient_id
ALTER TABLE public.outreach_log DROP CONSTRAINT IF EXISTS outreach_log_patient_id_fkey;
ALTER TABLE public.outreach_log ADD CONSTRAINT outreach_log_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;

-- Fix: Add ON DELETE CASCADE to messages.patient_id (if messages has patient_id FK)
DO $$
BEGIN
  ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_patient_id_fkey;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
