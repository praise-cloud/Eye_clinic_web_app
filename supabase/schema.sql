-- =============================================
-- EYE CLIN
-- =============================================
-- Run this complete script in Supabase SQL Editor
-- This includes all tables, RLS policies, triggers, and fixes
-- =============================================
-- 1. EXTENSIONS
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- =============================================
-- 2. HELPER FUNCTIONS
-- =============================================
CREATE OR REPLACE FUNCTION get_user_role() RETURNS TEXT AS $$
SELECT role
FROM public.profiles
WHERE id = auth.uid()
LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;
-- =============================================
-- 3. CORE TABLES
-- =============================================
-- PROFILES (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT NOT NULL CHECK (
    role IN ('frontdesk', 'doctor', 'admin', 'manager')
  ),
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- PATIENTS
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_number TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  phone TEXT,
  email TEXT,
  address TEXT,
  occupation TEXT,
  next_of_kin_name TEXT,
  next_of_kin_phone TEXT,
  allergies TEXT,
  subscription_type TEXT DEFAULT 'none' CHECK (
    subscription_type IN ('none', 'basic', 'standard', 'premium')
  ),
  subscription_start TEXT,
  subscription_end TEXT,
  registered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- APPOINTMENTS
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.profiles(id) NOT NULL,
  requested_by UUID REFERENCES auth.users(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  appointment_type TEXT NOT NULL CHECK (
    appointment_type IN (
      'checkup',
      'follow_up',
      'new_consultation',
      'glasses_fitting',
      'emergency'
    )
  ),
  status TEXT DEFAULT 'pending' CHECK (
    status IN (
      'pending',
      'confirmed',
      'arrived',
      'in_progress',
      'completed',
      'cancelled',
      'no_show'
    )
  ),
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- DRUGS (Pharmacy Inventory)
CREATE TABLE IF NOT EXISTS public.drugs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  generic_name TEXT,
  category TEXT,
  unit TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  reorder_level INTEGER DEFAULT 10,
  purchase_price NUMERIC,
  selling_price NUMERIC NOT NULL,
  supplier TEXT,
  expiry_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- GLASSES INVENTORY
CREATE TABLE IF NOT EXISTS public.glasses_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  frame_name TEXT NOT NULL,
  frame_brand TEXT,
  frame_code TEXT,
  color TEXT,
  material TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'unisex')),
  quantity INTEGER DEFAULT 0,
  reorder_level INTEGER DEFAULT 3,
  purchase_price NUMERIC,
  selling_price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- INVENTORY OTHERS
CREATE TABLE IF NOT EXISTS public.inventory_others (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  unit TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  reorder_level INTEGER DEFAULT 5,
  purchase_price NUMERIC,
  selling_price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- DRUG DISPENSING
CREATE TABLE IF NOT EXISTS public.drug_dispensing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  drug_id UUID REFERENCES public.drugs(id) NOT NULL,
  dispensed_by UUID REFERENCES auth.users(id) NOT NULL,
  prescription_note TEXT,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  dispensed_at TIMESTAMPTZ DEFAULT NOW()
);
-- INVENTORY DISPENSING (Non-drug items)
CREATE TABLE IF NOT EXISTS public.inventory_dispensing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.inventory_others(id) NOT NULL,
  dispensed_by UUID REFERENCES auth.users(id) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  notes TEXT,
  dispensed_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.inventory_dispensing ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'inventory_dispensing'
    AND policyname = 'All view inventory dispensing'
) THEN CREATE POLICY "All view inventory dispensing" ON public.inventory_dispensing FOR
SELECT TO authenticated USING (TRUE);
END IF;
END $$;
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'inventory_dispensing'
    AND policyname = 'Frontdesk/admin dispense items'
) THEN CREATE POLICY "Frontdesk/admin dispense items" ON public.inventory_dispensing FOR
INSERT TO authenticated WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));
END IF;
END $$;
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'inventory_dispensing'
    AND policyname = 'Frontdesk/admin delete dispensing'
) THEN CREATE POLICY "Frontdesk/admin delete dispensing" ON public.inventory_dispensing FOR
DELETE TO authenticated USING (get_user_role() IN ('frontdesk', 'admin'));
END IF;
END $$;
-- GLASSES ORDERS
CREATE TABLE IF NOT EXISTS public.glasses_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  prescription_id UUID,
  frame_id UUID REFERENCES public.glasses_inventory(id) ON DELETE
  SET NULL,
    lens_type TEXT,
    lens_coating TEXT,
    frame_price NUMERIC,
    lens_price NUMERIC,
    total_price NUMERIC,
    status TEXT DEFAULT 'pending' CHECK (
      status IN (
        'pending',
        'in_lab',
        'ready',
        'dispensed',
        'cancelled'
      )
    ),
    deposit_paid NUMERIC DEFAULT 0,
    estimated_ready TEXT,
    created_by UUID REFERENCES auth.users(id),
    dispensed_by UUID REFERENCES auth.users(id),
    dispensed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- PRESCRIPTIONS
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.profiles(id) NOT NULL,
  case_note_id UUID,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'dispensed')),
  re_sphere NUMERIC,
  re_cylinder NUMERIC,
  re_axis INTEGER,
  re_add NUMERIC,
  re_va TEXT,
  le_sphere NUMERIC,
  le_cylinder NUMERIC,
  le_axis INTEGER,
  le_add NUMERIC,
  le_va TEXT,
  pd NUMERIC,
  lens_type TEXT CHECK (
    lens_type IN (
      'single_vision',
      'bifocal',
      'progressive',
      'reading'
    )
  ),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- CASE NOTES
CREATE TABLE IF NOT EXISTS public.case_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.profiles(id) NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id),
  chief_complaint TEXT NOT NULL,
  history TEXT,
  examination TEXT,
  diagnosis TEXT,
  treatment_plan TEXT,
  follow_up_date TEXT,
  is_encrypted BOOLEAN DEFAULT FALSE,
  cvf_attachment_url TEXT,
  -- New ophthalmology fields
  visiting_date TEXT,
  ophthalmoscopy_notes TEXT,
  previous_rx TEXT,
  externals TEXT,
  unaided_dist_re TEXT,
  unaided_dist_le TEXT,
  unaided_near_re TEXT,
  unaided_near_le TEXT,
  aided_dist_re TEXT,
  aided_dist_le TEXT,
  aided_near_re TEXT,
  aided_near_le TEXT,
  objective_re_va TEXT,
  objective_le_va TEXT,
  subjective_re_add TEXT,
  subjective_re_va TEXT,
  subjective_le_add TEXT,
  subjective_le_va TEXT,
  ret BOOLEAN DEFAULT FALSE,
  autoref BOOLEAN DEFAULT FALSE,
  tonometry_re TEXT,
  tonometry_le TEXT,
  tonometry_time TEXT,
  recommendation TEXT,
  final_rx_od TEXT,
  final_rx_os TEXT,
  lens_type TEXT,
  next_visiting_date TEXT,
  outstanding_bill NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Migrate existing case_notes tables: add new columns if they don't exist
ALTER TABLE public.case_notes
ADD COLUMN IF NOT EXISTS visiting_date TEXT,
  ADD COLUMN IF NOT EXISTS ophthalmoscopy_notes TEXT,
  ADD COLUMN IF NOT EXISTS previous_rx TEXT,
  ADD COLUMN IF NOT EXISTS externals TEXT,
  ADD COLUMN IF NOT EXISTS unaided_dist_re TEXT,
  ADD COLUMN IF NOT EXISTS unaided_dist_le TEXT,
  ADD COLUMN IF NOT EXISTS unaided_near_re TEXT,
  ADD COLUMN IF NOT EXISTS unaided_near_le TEXT,
  ADD COLUMN IF NOT EXISTS aided_dist_re TEXT,
  ADD COLUMN IF NOT EXISTS aided_dist_le TEXT,
  ADD COLUMN IF NOT EXISTS aided_near_re TEXT,
  ADD COLUMN IF NOT EXISTS aided_near_le TEXT,
  ADD COLUMN IF NOT EXISTS objective_re_va TEXT,
  ADD COLUMN IF NOT EXISTS objective_le_va TEXT,
  ADD COLUMN IF NOT EXISTS subjective_re_add TEXT,
  ADD COLUMN IF NOT EXISTS subjective_re_va TEXT,
  ADD COLUMN IF NOT EXISTS subjective_le_add TEXT,
  ADD COLUMN IF NOT EXISTS subjective_le_va TEXT,
  ADD COLUMN IF NOT EXISTS ret BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS autoref BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS tonometry_re TEXT,
  ADD COLUMN IF NOT EXISTS tonometry_le TEXT,
  ADD COLUMN IF NOT EXISTS tonometry_time TEXT,
  ADD COLUMN IF NOT EXISTS recommendation TEXT,
  ADD COLUMN IF NOT EXISTS final_rx_od TEXT,
  ADD COLUMN IF NOT EXISTS final_rx_os TEXT,
  ADD COLUMN IF NOT EXISTS lens_type TEXT,
  ADD COLUMN IF NOT EXISTS next_visiting_date TEXT,
  ADD COLUMN IF NOT EXISTS outstanding_bill NUMERIC;
-- PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_number TEXT UNIQUE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  payment_type TEXT NOT NULL CHECK (
    payment_type IN (
      'consultation',
      'drug',
      'glasses_deposit',
      'glasses_balance',
      'subscription',
      'other'
    )
  ),
  reference_id TEXT,
  amount NUMERIC NOT NULL,
  payment_method TEXT CHECK (
    payment_method IN ('cash', 'transfer', 'pos', 'other')
  ),
  received_by UUID REFERENCES auth.users(id),
  notes TEXT,
  paid_at TIMESTAMPTZ DEFAULT NOW()
);
-- MESSAGES (Chat)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  attachment_type TEXT CHECK (attachment_type IN ('image', 'document')),
  attachment_url TEXT,
  attachment_name TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (
    type IN (
      'appointment',
      'prescription',
      'low_stock',
      'payment',
      'patient',
      'dispensing',
      'glasses',
      'system'
    )
  ),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  table_name TEXT NOT NULL,
  record_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- DAILY SUMMARY (for reports)
DO $$ DECLARE
    obj_kind "char";
BEGIN
    SELECT c.relkind INTO obj_kind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'daily_summary';
    
    IF obj_kind = 'v' THEN
        EXECUTE 'DROP VIEW public.daily_summary';
    ELSIF obj_kind = 'r' THEN
        EXECUTE 'DROP TABLE public.daily_summary CASCADE';
    END IF;
END $$;
CREATE TABLE public.daily_summary (
  summary_date DATE PRIMARY KEY,
  new_patients INTEGER DEFAULT 0,
  returning_patients INTEGER DEFAULT 0,
  drug_revenue NUMERIC DEFAULT 0,
  glasses_revenue NUMERIC DEFAULT 0,
  consultation_revenue NUMERIC DEFAULT 0,
  subscription_revenue NUMERIC DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0
);
-- OUTREACH LOG
CREATE TABLE IF NOT EXISTS public.outreach_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  sent_by UUID REFERENCES auth.users(id) NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email', 'whatsapp')),
  message_template TEXT,
  message_body TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'delivered')),
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
-- SETTINGS
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- PUSH SUBSCRIPTIONS (for web push)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- =============================================
-- 4. INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_patients_patient_number ON public.patients(patient_number);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON public.patients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON public.appointments(scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
-- =============================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glasses_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_others ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drug_dispensing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glasses_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_dispensing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
-- =============================================
-- 6. RLS POLICIES
-- =============================================
-- PROFILES POLICIES
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'profiles'
    AND policyname = 'All view profiles'
) THEN CREATE POLICY "All view profiles" ON public.profiles FOR
SELECT TO authenticated USING (TRUE);
END IF;
END $$;
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'profiles'
    AND policyname = 'Users update own profile'
) THEN CREATE POLICY "Users update own profile" ON public.profiles FOR
UPDATE TO authenticated USING (id = auth.uid());
END IF;
END $$;
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'profiles'
    AND policyname = 'Admin manage profiles'
) THEN CREATE POLICY "Admin manage profiles" ON public.profiles FOR ALL TO authenticated USING (get_user_role() = 'admin');
END IF;
END $$;
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'profiles'
    AND policyname = 'Manager manage profiles'
) THEN CREATE POLICY "Manager manage profiles" ON public.profiles FOR ALL TO authenticated USING (get_user_role() = 'manager');
END IF;
END $$;
-- PATIENTS POLICIES
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'patients'
    AND policyname = 'All view patients'
) THEN CREATE POLICY "All view patients" ON public.patients FOR
SELECT TO authenticated USING (TRUE);
END IF;
END $$;
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'patients'
    AND policyname = 'Frontdesk/admin manage patients'
) THEN CREATE POLICY "Frontdesk/admin manage patients" ON public.patients FOR ALL TO authenticated USING (get_user_role() IN ('frontdesk', 'admin'));
END IF;
END $$;
-- APPOINTMENTS POLICIES
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'appointments'
    AND policyname = 'All view appointments'
) THEN CREATE POLICY "All view appointments" ON public.appointments FOR
SELECT TO authenticated USING (TRUE);
END IF;
END $$;
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'appointments'
    AND policyname = 'Doctor manages own appointments'
) THEN CREATE POLICY "Doctor manages own appointments" ON public.appointments FOR ALL TO authenticated USING (doctor_id = auth.uid());
END IF;
END $$;
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'appointments'
    AND policyname = 'Frontdesk/admin manage appointments'
) THEN CREATE POLICY "Frontdesk/admin manage appointments" ON public.appointments FOR ALL TO authenticated USING (get_user_role() IN ('frontdesk', 'admin'));
END IF;
END $$;
-- DRUGS POLICIES
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'drugs'
    AND policyname = 'All staff view drugs'
) THEN CREATE POLICY "All staff view drugs" ON public.drugs FOR
SELECT TO authenticated USING (TRUE);
END IF;
END $$;
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'drugs'
    AND policyname = 'Frontdesk/admin manage drugs'
) THEN CREATE POLICY "Frontdesk/admin manage drugs" ON public.drugs FOR ALL TO authenticated USING (get_user_role() IN ('frontdesk', 'admin'));
END IF;
END $$;
-- DRUG DISPENSING POLICIES
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'drug_dispensing'
    AND policyname = 'View dispensing'
) THEN CREATE POLICY "View dispensing" ON public.drug_dispensing FOR
SELECT TO authenticated USING (
    get_user_role() IN ('doctor', 'frontdesk', 'admin')
  );
END IF;
END $$;
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'drug_dispensing'
    AND policyname = 'Frontdesk/admin dispenses'
) THEN CREATE POLICY "Frontdesk/admin dispenses" ON public.drug_dispensing FOR
INSERT TO authenticated WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));
END IF;
END $$;
-- GLASSES INVENTORY POLICIES
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'glasses_inventory'
    AND policyname = 'All view glasses'
) THEN CREATE POLICY "All view glasses" ON public.glasses_inventory FOR
SELECT TO authenticated USING (TRUE);
END IF;
END $$;
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'glasses_inventory'
    AND policyname = 'Frontdesk/admin manage glasses'
) THEN CREATE POLICY "Frontdesk/admin manage glasses" ON public.glasses_inventory FOR ALL TO authenticated USING (get_user_role() IN ('frontdesk', 'admin')) WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));
END IF;
END $$;
-- GLASSES ORDERS POLICIES
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'glasses_orders'
    AND policyname = 'All view orders'
) THEN CREATE POLICY "All view orders" ON public.glasses_orders FOR
SELECT TO authenticated USING (TRUE);
END IF;
END $$;
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'glasses_orders'
    AND policyname = 'Frontdesk/admin manage orders'
) THEN CREATE POLICY "Frontdesk/admin manage orders" ON public.glasses_orders FOR ALL TO authenticated USING (get_user_role() IN ('frontdesk', 'admin'));
END IF;
END $$;
-- INVENTORY OTHERS POLICIES
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'inventory_others'
    AND policyname = 'All view inventory others'
) THEN CREATE POLICY "All view inventory others" ON public.inventory_others FOR
SELECT TO authenticated USING (TRUE);
END IF;
END $$;
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'inventory_others'
    AND policyname = 'Frontdesk/admin manage inventory others'
) THEN CREATE POLICY "Frontdesk/admin manage inventory others" ON public.inventory_others FOR ALL TO authenticated USING (get_user_role() IN ('frontdesk', 'admin')) WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));
END IF;
END $$;
-- PAYMENTS POLICIES
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'payments'
    AND policyname = 'Finance view payments'
) THEN CREATE POLICY "Finance view payments" ON public.payments FOR
SELECT TO authenticated USING (
    get_user_role() IN ('frontdesk', 'admin', 'manager')
  );
END IF;
END $$;
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'payments'
    AND policyname = 'Frontdesk/admin insert payments'
) THEN CREATE POLICY "Frontdesk/admin insert payments" ON public.payments FOR
INSERT TO authenticated WITH CHECK (
    get_user_role() IN ('frontdesk', 'admin', 'manager')
  );
END IF;
END $$;
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'payments'
    AND policyname = 'Admin manage payments'
) THEN CREATE POLICY "Admin manage payments" ON public.payments FOR ALL TO authenticated USING (get_user_role() = 'admin');
END IF;
END $$;
-- MESSAGES POLICIES
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'messages'
    AND policyname = 'Own messages'
) THEN CREATE POLICY "Own messages" ON public.messages FOR
SELECT TO authenticated USING (
    sender_id = auth.uid()
    OR receiver_id = auth.uid()
  );
END IF;
END $$;
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'messages'
    AND policyname = 'Send messages'
) THEN CREATE POLICY "Send messages" ON public.messages FOR
INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
END IF;
END $$;
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'messages'
    AND policyname = 'Edit own messages'
) THEN CREATE POLICY "Edit own messages" ON public.messages FOR
UPDATE TO authenticated USING (sender_id = auth.uid());
END IF;
END $$;
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'messages'
    AND policyname = 'Delete own messages'
) THEN CREATE POLICY "Delete own messages" ON public.messages FOR DELETE TO authenticated USING (sender_id = auth.uid());
END IF;
END $$;
-- NOTIFICATIONS POLICIES
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'notifications'
    AND policyname = 'Users view own notifications'
) THEN CREATE POLICY "Users view own notifications" ON public.notifications FOR
SELECT TO authenticated USING (user_id = auth.uid());
END IF;
END $$;
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'notifications'
    AND policyname = 'System creates notifications'
) THEN CREATE POLICY "System creates notifications" ON public.notifications FOR
INSERT TO authenticated WITH CHECK (TRUE);
END IF;
END $$;
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'notifications'
    AND policyname = 'Users update own notifications'
) THEN CREATE POLICY "Users update own notifications" ON public.notifications FOR
UPDATE TO authenticated USING (user_id = auth.uid());
END IF;
END $$;
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'notifications'
    AND policyname = 'Users delete own notifications'
) THEN CREATE POLICY "Users delete own notifications" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());
END IF;
END $$;
-- AUDIT LOGS POLICIES
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'audit_logs'
    AND policyname = 'Admin and manager view audit'
) THEN CREATE POLICY "Admin and manager view audit" ON public.audit_logs FOR
SELECT TO authenticated USING (get_user_role() IN ('admin', 'manager'));
END IF;
END $$;
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'audit_logs'
    AND policyname = 'Append audit'
) THEN CREATE POLICY "Append audit" ON public.audit_logs FOR
INSERT TO authenticated WITH CHECK (TRUE);
END IF;
END $$;
-- OUTREACH LOG POLICIES
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'outreach_log'
    AND policyname = 'Frontdesk/admin outreach'
) THEN CREATE POLICY "Frontdesk/admin outreach" ON public.outreach_log FOR ALL TO authenticated USING (get_user_role() IN ('frontdesk', 'admin'));
END IF;
END $$;
-- SETTINGS POLICIES
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'settings'
    AND policyname = 'Authenticated read settings'
) THEN CREATE POLICY "Authenticated read settings" ON public.settings FOR
SELECT TO authenticated USING (TRUE);
END IF;
END $$;
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'settings'
    AND policyname = 'Admin manage settings'
) THEN CREATE POLICY "Admin manage settings" ON public.settings FOR ALL TO authenticated USING (get_user_role() = 'admin');
END IF;
END $$;
-- PUSH SUBSCRIPTIONS POLICIES
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE tablename = 'push_subscriptions'
    AND policyname = 'Own push sub'
) THEN CREATE POLICY "Own push sub" ON public.push_subscriptions FOR ALL TO authenticated USING (user_id = auth.uid());
END IF;
END $$;
-- =============================================
-- 7. AUDIT TRIGGER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION public.audit_trigger_function() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO public.audit_logs (user_id, action, table_name, record_id)
VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id::TEXT);
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Apply audit triggers to key tables
DROP TRIGGER IF EXISTS audit_patients ON public.patients;
CREATE TRIGGER audit_patients
AFTER
INSERT
  OR
UPDATE
  OR DELETE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
DROP TRIGGER IF EXISTS audit_appointments ON public.appointments;
CREATE TRIGGER audit_appointments
AFTER
INSERT
  OR
UPDATE
  OR DELETE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
DROP TRIGGER IF EXISTS audit_payments ON public.payments;
CREATE TRIGGER audit_payments
AFTER
INSERT
  OR
UPDATE
  OR DELETE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
DROP TRIGGER IF EXISTS audit_drug_dispensing ON public.drug_dispensing;
CREATE TRIGGER audit_drug_dispensing
AFTER
INSERT
  OR
UPDATE
  OR DELETE ON public.drug_dispensing FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
DROP TRIGGER IF EXISTS audit_case_notes ON public.case_notes;
CREATE TRIGGER audit_case_notes
AFTER
INSERT
  OR
UPDATE
  OR DELETE ON public.case_notes FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
DROP TRIGGER IF EXISTS audit_glasses_orders ON public.glasses_orders;
CREATE TRIGGER audit_glasses_orders
AFTER
INSERT
  OR
UPDATE
  OR DELETE ON public.glasses_orders FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
DROP TRIGGER IF EXISTS audit_inventory_others ON public.inventory_others;
CREATE TRIGGER audit_inventory_others
AFTER
INSERT
  OR
UPDATE
  OR DELETE ON public.inventory_others FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
-- =============================================
-- 8. PROFILE CREATION TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO public.profiles (id, full_name, role)
VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'frontdesk')
  );
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- =============================================
-- 9. ADD TO REALTIME PUBLICATION
-- =============================================
-- Use DO blocks with exception handling for each table
DO $$ BEGIN -- messages
BEGIN ALTER PUBLICATION supabase_realtime
ADD TABLE public.messages;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN OTHERS THEN NULL;
END;
-- notifications
BEGIN ALTER PUBLICATION supabase_realtime
ADD TABLE public.notifications;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN OTHERS THEN NULL;
END;
-- appointments
BEGIN ALTER PUBLICATION supabase_realtime
ADD TABLE public.appointments;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN OTHERS THEN NULL;
END;
-- drugs
BEGIN ALTER PUBLICATION supabase_realtime
ADD TABLE public.drugs;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN OTHERS THEN NULL;
END;
-- glasses_inventory
BEGIN ALTER PUBLICATION supabase_realtime
ADD TABLE public.glasses_inventory;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN OTHERS THEN NULL;
END;
-- payments
BEGIN ALTER PUBLICATION supabase_realtime
ADD TABLE public.payments;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN OTHERS THEN NULL;
END;
-- case_notes
BEGIN ALTER PUBLICATION supabase_realtime
ADD TABLE public.case_notes;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN OTHERS THEN NULL;
END;
END $$;
-- =============================================
-- LOW STOCK DRUGS VIEW
-- =============================================
DROP VIEW IF EXISTS public.low_stock_drugs CASCADE;
CREATE VIEW public.low_stock_drugs AS
SELECT d.*
FROM public.drugs d
WHERE d.quantity <= d.reorder_level
  AND d.quantity >0
ORDER BY d.quantity ASC;
ALTER VIEW public.low_stock_drugs SET (security_invoker = true);

-- =============================================
-- COMPLETE!
-- =============================================
-- Run this script in Supabase SQL Editor to set up the complete database.
-- All tables, RLS policies, triggers, and indexes are included.