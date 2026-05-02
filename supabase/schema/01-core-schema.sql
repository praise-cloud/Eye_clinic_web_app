-- =============================================
-- EYE CLINIC DATABASE - CORE SCHEMA
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- CORE FUNCTIONS
-- =============================================

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role() RETURNS TEXT AS $$
SELECT role
FROM public.profiles
WHERE id = auth.uid()
LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function to get current user's profile
CREATE OR REPLACE FUNCTION get_current_profile() RETURNS RECORD AS $$
SELECT *
FROM public.profiles
WHERE id = auth.uid()
LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- =============================================
-- CORE TABLES
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
  -- Ophthalmology specific fields
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

-- PRESCRIPTIONS
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.profiles(id) NOT NULL,
  case_note_id UUID REFERENCES public.case_notes(id),
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

-- =============================================
-- CORE INDEXES
-- =============================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- Patients indexes
CREATE INDEX IF NOT EXISTS idx_patients_patient_number ON public.patients(patient_number);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON public.patients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patients_name ON public.patients(first_name, last_name);

-- Appointments indexes
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON public.appointments(scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);

-- Case notes indexes
CREATE INDEX IF NOT EXISTS idx_case_notes_patient_id ON public.case_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_case_notes_doctor_id ON public.case_notes(doctor_id);
CREATE INDEX IF NOT EXISTS idx_case_notes_created_at ON public.case_notes(created_at DESC);

-- Prescriptions indexes
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON public.prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON public.prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON public.prescriptions(status);

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CORE TRIGGERS
-- =============================================

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_case_notes_updated_at BEFORE UPDATE ON public.case_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- PROFILE CREATION TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email?.split('@')[0] || 'User'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'frontdesk')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- REALTIME PUBLICATION
-- =============================================

DO $$
BEGIN
    -- Add core tables to realtime publication
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.case_notes; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.prescriptions; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

SELECT 'Core schema created successfully' as status;
