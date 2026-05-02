CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. HELPER FUNCTIONS
-- =============================================
CREATE OR REPLACE FUNCTION get_user_role() RETURNS TEXT AS $$
SELECT role
FROM public.profiles
WHERE id = auth.uid()
LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

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

-- GLASSES ORDERS
CREATE TABLE IF NOT EXISTS public.glasses_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  prescription_id UUID,
  frame_id UUID REFERENCES public.glasses_inventory(id) ON DELETE SET NULL,
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

-- 6. BASIC RLS POLICIES (will be enhanced in 02-rls-policies.sql)
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

-- 7. AUDIT TRIGGER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION public.audit_trigger_function() RETURNS TRIGGER AS $$
DECLARE
  target_id TEXT;
BEGIN
  target_id := COALESCE(NEW.id::TEXT, OLD.id::TEXT);
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id)
  VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, target_id);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to key tables
DROP TRIGGER IF EXISTS audit_patients ON public.patients;
CREATE TRIGGER audit_patients
AFTER INSERT OR UPDATE OR DELETE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_appointments ON public.appointments;
CREATE TRIGGER audit_appointments
AFTER INSERT OR UPDATE OR DELETE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_payments ON public.payments;
CREATE TRIGGER audit_payments
AFTER INSERT OR UPDATE OR DELETE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

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
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. ADD TO REALTIME PUBLICATION
-- =============================================
DO $$ BEGIN
BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
END;
BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
END;
BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
END;
BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.drugs;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
END;
BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.glasses_inventory;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
END;
BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
END;
BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.case_notes;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
END;
END $$;
