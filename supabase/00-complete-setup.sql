
DO $$
DECLARE
    pol RECORD;
    trig RECORD;
    func RECORD;
    tbl RECORD;
BEGIN
    -- Drop ALL RLS policies on ALL tables
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;

    -- Drop ALL triggers
    FOR trig IN 
        SELECT trigger_name, event_object_table 
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public' OR trigger_name = 'on_auth_user_created'
    LOOP
        BEGIN
            EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I', 
                trig.trigger_name, 'public', trig.event_object_table);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END LOOP;

    -- Drop ALL functions
    FOR func IN 
        SELECT routine_name, routine_schema
        FROM information_schema.routines 
        WHERE routine_schema IN ('public', 'auth')
        AND routine_name IN (
            'handle_new_user', 'update_updated_at_column', 'get_user_role', 
            'get_current_profile', 'audit_trigger_function', 'mark_message_read',
            'update_drug_quantity_on_dispensing', 'update_inventory_others_quantity_on_dispensing',
            'update_glasses_quantity_on_order', 'update_daily_summary_on_payment',
            'update_daily_summary_on_appointment'
        )
    LOOP
        BEGIN
            EXECUTE format('DROP FUNCTION IF EXISTS %I.%I() CASCADE', 
                func.routine_schema, func.routine_name);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END LOOP;

    -- Drop ALL tables (CASCADE handles FK constraints)
    FOR tbl IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    LOOP
        BEGIN
            EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', tbl.table_name);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END LOOP;
END $$;

SELECT 'Cleanup complete' as status;

-- Drop ALL tables (CASCADE handles FK constraints)
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.push_subscriptions CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.outreach_log CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.daily_summary CASCADE;
DROP TABLE IF EXISTS public.glasses_orders CASCADE;
DROP TABLE IF EXISTS public.inventory_dispensing CASCADE;
DROP TABLE IF EXISTS public.drug_dispensing CASCADE;
DROP TABLE IF EXISTS public.inventory_others CASCADE;
DROP TABLE IF EXISTS public.glasses_inventory CASCADE;
DROP TABLE IF EXISTS public.drugs CASCADE;
DROP TABLE IF EXISTS public.prescriptions CASCADE;
DROP TABLE IF EXISTS public.case_notes CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.patients CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

SELECT 'Cleanup complete' as status;

-- =============================================
-- STEP 2: CORE TABLES
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES (extends Supabase Auth)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('frontdesk', 'doctor', 'admin', 'manager')),
  password_hash TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PATIENTS
CREATE TABLE public.patients (
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
  subscription_type TEXT DEFAULT 'none' CHECK (subscription_type IN ('none', 'basic', 'standard', 'premium')),
  subscription_start TEXT,
  subscription_end TEXT,
  registered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- APPOINTMENTS
CREATE TABLE public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.profiles(id) NOT NULL,
  requested_by UUID REFERENCES auth.users(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  appointment_type TEXT NOT NULL CHECK (appointment_type IN ('checkup', 'follow_up', 'new_consultation', 'glasses_fitting', 'emergency')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'arrived', 'in_progress', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CASE NOTES
CREATE TABLE public.case_notes (
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
CREATE TABLE public.prescriptions (
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
  lens_type TEXT CHECK (lens_type IN ('single_vision', 'bifocal', 'progressive', 'reading')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT 'Core tables created' as status;

-- =============================================
-- STEP 3: INVENTORY TABLES
-- =============================================

-- DRUGS (Pharmacy Inventory)
CREATE TABLE public.drugs (
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
  batch_number TEXT,
  storage_location TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- GLASSES INVENTORY
CREATE TABLE public.glasses_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  frame_name TEXT NOT NULL,
  frame_brand TEXT,
  frame_code TEXT,
  color TEXT,
  material TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'unisex')),
  frame_type TEXT CHECK (frame_type IN ('full', 'semi-rimless', 'rimless')),
  size TEXT,
  quantity INTEGER DEFAULT 0,
  reorder_level INTEGER DEFAULT 3,
  purchase_price NUMERIC,
  selling_price NUMERIC NOT NULL,
  supplier TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INVENTORY OTHERS (Non-drug, non-glasses items)
CREATE TABLE public.inventory_others (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  unit TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  reorder_level INTEGER DEFAULT 5,
  purchase_price NUMERIC,
  selling_price NUMERIC NOT NULL,
  supplier TEXT,
  storage_location TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DRUG DISPENSING
CREATE TABLE public.drug_dispensing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  drug_id UUID REFERENCES public.drugs(id) NOT NULL,
  dispensed_by UUID REFERENCES auth.users(id) NOT NULL,
  prescription_note TEXT,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  batch_number TEXT,
  expiry_date TEXT,
  dispensed_at TIMESTAMPTZ DEFAULT NOW()
);

-- INVENTORY DISPENSING (Non-drug items)
CREATE TABLE public.inventory_dispensing (
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
CREATE TABLE public.glasses_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  prescription_id UUID REFERENCES public.prescriptions(id),
  frame_id UUID REFERENCES public.glasses_inventory(id) ON DELETE SET NULL,
  lens_type TEXT,
  lens_coating TEXT,
  frame_price NUMERIC,
  lens_price NUMERIC,
  total_price NUMERIC,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_lab', 'ready', 'dispensed', 'cancelled')),
  deposit_paid NUMERIC DEFAULT 0,
  balance_paid NUMERIC DEFAULT 0,
  estimated_ready TEXT,
  lab_notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  dispensed_by UUID REFERENCES auth.users(id),
  dispensed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT 'Inventory tables created' as status;

-- =============================================
-- STEP 4: PAYMENT TABLES
-- =============================================

-- PAYMENTS
CREATE TABLE public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_number TEXT UNIQUE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('consultation', 'drug', 'glasses_deposit', 'glasses_balance', 'subscription', 'other')),
  reference_id TEXT,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  payment_method TEXT CHECK (payment_method IN ('cash', 'transfer', 'pos', 'other')),
  received_by UUID REFERENCES auth.users(id),
  notes TEXT,
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUBSCRIPTIONS
CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  subscription_type TEXT NOT NULL CHECK (subscription_type IN ('basic', 'standard', 'premium')),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  payment_method TEXT CHECK (payment_method IN ('cash', 'transfer', 'pos', 'other')),
  is_active BOOLEAN DEFAULT TRUE,
  auto_renew BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INVOICES
CREATE TABLE public.invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  items JSONB NOT NULL,
  subtotal NUMERIC NOT NULL CHECK (subtotal >= 0),
  tax_amount NUMERIC DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount NUMERIC NOT NULL CHECK (total_amount > 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'partial', 'cancelled')),
  paid_amount NUMERIC DEFAULT 0 CHECK (paid_amount >= 0),
  due_date TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DAILY SUMMARY
CREATE TABLE public.daily_summary (
  summary_date DATE PRIMARY KEY,
  new_patients INTEGER DEFAULT 0,
  returning_patients INTEGER DEFAULT 0,
  drug_revenue NUMERIC DEFAULT 0 CHECK (drug_revenue >= 0),
  glasses_revenue NUMERIC DEFAULT 0 CHECK (glasses_revenue >= 0),
  consultation_revenue NUMERIC DEFAULT 0 CHECK (consultation_revenue >= 0),
  subscription_revenue NUMERIC DEFAULT 0 CHECK (subscription_revenue >= 0),
  other_revenue NUMERIC DEFAULT 0 CHECK (other_revenue >= 0),
  total_revenue NUMERIC DEFAULT 0 CHECK (total_revenue >= 0),
  total_appointments INTEGER DEFAULT 0,
  completed_appointments INTEGER DEFAULT 0,
  cancelled_appointments INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT 'Payment tables created' as status;

-- =============================================
-- STEP 5: COMMUNICATION TABLES
-- =============================================

-- MESSAGES
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  attachment_type TEXT CHECK (attachment_type IN ('image', 'document')),
  attachment_url TEXT,
  attachment_name TEXT,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'notification')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  reply_to_id UUID REFERENCES public.messages(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('appointment', 'prescription', 'low_stock', 'payment', 'patient', 'dispensing', 'glasses', 'system', 'message')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  metadata JSONB,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- OUTREACH LOG
CREATE TABLE public.outreach_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  sent_by UUID REFERENCES auth.users(id) NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email', 'whatsapp', 'call')),
  message_template TEXT,
  message_body TEXT,
  recipient_number TEXT,
  recipient_email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  error_message TEXT,
  cost NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SYSTEM SETTINGS
CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  description TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'notifications', 'messaging', 'appointments', 'inventory', 'payments', 'security')),
  is_public BOOLEAN DEFAULT FALSE,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PUSH SUBSCRIPTIONS
CREATE TABLE public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription JSONB NOT NULL,
  endpoint TEXT,
  p256dh TEXT,
  auth TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUDIT LOGS (FIXED: record_id is TEXT)
CREATE TABLE public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW')),
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT 'Communication tables created' as status;

-- =============================================
-- STEP 6: INDEXES
-- =============================================

-- Profiles indexes
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX idx_profiles_created_at ON public.profiles(created_at DESC);

-- Patients indexes
CREATE INDEX idx_patients_patient_number ON public.patients(patient_number);
CREATE INDEX idx_patients_created_at ON public.patients(created_at DESC);
CREATE INDEX idx_patients_name ON public.patients(first_name, last_name);

-- Appointments indexes
CREATE INDEX idx_appointments_scheduled_at ON public.appointments(scheduled_at DESC);
CREATE INDEX idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX idx_appointments_status ON public.appointments(status);

-- Case notes indexes
CREATE INDEX idx_case_notes_patient_id ON public.case_notes(patient_id);
CREATE INDEX idx_case_notes_doctor_id ON public.case_notes(doctor_id);
CREATE INDEX idx_case_notes_created_at ON public.case_notes(created_at DESC);

-- Prescriptions indexes
CREATE INDEX idx_prescriptions_patient_id ON public.prescriptions(patient_id);
CREATE INDEX idx_prescriptions_doctor_id ON public.prescriptions(doctor_id);
CREATE INDEX idx_prescriptions_status ON public.prescriptions(status);

-- Drugs indexes
CREATE INDEX idx_drugs_name ON public.drugs(name);
CREATE INDEX idx_drugs_category ON public.drugs(category);
CREATE INDEX idx_drugs_quantity ON public.drugs(quantity);
CREATE INDEX idx_drugs_expiry_date ON public.drugs(expiry_date);
CREATE INDEX idx_drugs_is_active ON public.drugs(is_active);

-- Glasses inventory indexes
CREATE INDEX idx_glasses_inventory_frame_name ON public.glasses_inventory(frame_name);
CREATE INDEX idx_glasses_inventory_brand ON public.glasses_inventory(frame_brand);
CREATE INDEX idx_glasses_inventory_gender ON public.glasses_inventory(gender);
CREATE INDEX idx_glasses_inventory_quantity ON public.glasses_inventory(quantity);
CREATE INDEX idx_glasses_inventory_is_active ON public.glasses_inventory(is_active);

-- Inventory others indexes
CREATE INDEX idx_inventory_others_name ON public.inventory_others(name);
CREATE INDEX idx_inventory_others_category ON public.inventory_others(category);
CREATE INDEX idx_inventory_others_quantity ON public.inventory_others(quantity);
CREATE INDEX idx_inventory_others_is_active ON public.inventory_others(is_active);

-- Dispensing indexes
CREATE INDEX idx_drug_dispensing_patient_id ON public.drug_dispensing(patient_id);
CREATE INDEX idx_drug_dispensing_drug_id ON public.drug_dispensing(drug_id);
CREATE INDEX idx_drug_dispensing_dispensed_at ON public.drug_dispensing(dispensed_at DESC);
CREATE INDEX idx_inventory_dispensing_patient_id ON public.inventory_dispensing(patient_id);
CREATE INDEX idx_inventory_dispensing_item_id ON public.inventory_dispensing(item_id);
CREATE INDEX idx_inventory_dispensing_dispensed_at ON public.inventory_dispensing(dispensed_at DESC);

-- Glasses orders indexes
CREATE INDEX idx_glasses_orders_order_number ON public.glasses_orders(order_number);
CREATE INDEX idx_glasses_orders_patient_id ON public.glasses_orders(patient_id);
CREATE INDEX idx_glasses_orders_status ON public.glasses_orders(status);
CREATE INDEX idx_glasses_orders_created_at ON public.glasses_orders(created_at DESC);

-- Payments indexes
CREATE INDEX idx_payments_receipt_number ON public.payments(receipt_number);
CREATE INDEX idx_payments_patient_id ON public.payments(patient_id);
CREATE INDEX idx_payments_payment_type ON public.payments(payment_type);
CREATE INDEX idx_payments_payment_method ON public.payments(payment_method);
CREATE INDEX idx_payments_paid_at ON public.payments(paid_at DESC);
CREATE INDEX idx_payments_received_by ON public.payments(received_by);

-- Subscriptions indexes
CREATE INDEX idx_subscriptions_patient_id ON public.subscriptions(patient_id);
CREATE INDEX idx_subscriptions_subscription_type ON public.subscriptions(subscription_type);
CREATE INDEX idx_subscriptions_is_active ON public.subscriptions(is_active);
CREATE INDEX idx_subscriptions_end_date ON public.subscriptions(end_date);

-- Invoices indexes
CREATE INDEX idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX idx_invoices_patient_id ON public.invoices(patient_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX idx_invoices_created_at ON public.invoices(created_at DESC);

-- Daily summary indexes
CREATE INDEX idx_daily_summary_summary_date ON public.daily_summary(summary_date);
CREATE INDEX idx_daily_summary_created_at ON public.daily_summary(created_at DESC);

-- Messages indexes
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX idx_messages_is_read ON public.messages(is_read);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_messages_reply_to_id ON public.messages(reply_to_id);
CREATE INDEX idx_messages_priority ON public.messages(priority);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_expires_at ON public.notifications(expires_at);

-- Outreach log indexes
CREATE INDEX idx_outreach_log_patient_id ON public.outreach_log(patient_id);
CREATE INDEX idx_outreach_log_sent_by ON public.outreach_log(sent_by);
CREATE INDEX idx_outreach_log_channel ON public.outreach_log(channel);
CREATE INDEX idx_outreach_log_status ON public.outreach_log(status);
CREATE INDEX idx_outreach_log_sent_at ON public.outreach_log(sent_at DESC);

-- Settings indexes
CREATE INDEX idx_settings_category ON public.settings(category);
CREATE INDEX idx_settings_is_public ON public.settings(is_public);
CREATE INDEX idx_settings_updated_at ON public.settings(updated_at DESC);

-- Push subscriptions indexes
CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_is_active ON public.push_subscriptions(is_active);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

SELECT 'Indexes created' as status;

-- =============================================
-- STEP 7: ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glasses_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_others ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drug_dispensing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_dispensing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glasses_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

SELECT 'RLS enabled' as status;

-- =============================================
-- STEP 8: CORE FUNCTIONS
-- =============================================

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role() RETURNS TEXT AS $$
SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Profile creation trigger function (FIXED: Better error handling)
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role, is_active)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        ),
        COALESCE(NEW.raw_user_meta_data->>'role', 'frontdesk'),
        TRUE
    );
    RETURN NEW;
EXCEPTION WHEN unique_violation THEN
    -- Profile already exists, just return
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

SELECT 'Core functions created' as status;

-- =============================================
-- STEP 9: INVENTORY TRIGGERS
-- =============================================

-- Update inventory quantity on dispensing
CREATE OR REPLACE FUNCTION update_drug_quantity_on_dispensing()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.drugs 
    SET quantity = quantity - NEW.quantity, updated_at = NOW()
    WHERE id = NEW.drug_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER drug_dispensing_update_quantity 
    AFTER INSERT ON public.drug_dispensing 
    FOR EACH ROW EXECUTE FUNCTION update_drug_quantity_on_dispensing();

CREATE OR REPLACE FUNCTION update_inventory_others_quantity_on_dispensing()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.inventory_others 
    SET quantity = quantity - NEW.quantity, updated_at = NOW()
    WHERE id = NEW.item_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inventory_dispensing_update_quantity 
    AFTER INSERT ON public.inventory_dispensing 
    FOR EACH ROW EXECUTE FUNCTION update_inventory_others_quantity_on_dispensing();

-- Update glasses inventory quantity on order status change
CREATE OR REPLACE FUNCTION update_glasses_quantity_on_order()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.frame_id IS NOT NULL AND OLD.status != 'dispensed' AND NEW.status = 'dispensed' THEN
        UPDATE public.glasses_inventory 
        SET quantity = quantity - 1, updated_at = NOW()
        WHERE id = NEW.frame_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER glasses_orders_update_quantity 
    AFTER UPDATE ON public.glasses_orders 
    FOR EACH ROW EXECUTE FUNCTION update_glasses_quantity_on_order();

SELECT 'Inventory triggers created' as status;

-- =============================================
-- STEP 10: PAYMENT TRIGGERS
-- =============================================

-- Update daily summary when payment is made
CREATE OR REPLACE FUNCTION update_daily_summary_on_payment()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.daily_summary (summary_date, total_revenue)
    VALUES (DATE(NEW.paid_at), NEW.amount)
    ON CONFLICT (summary_date) 
    DO UPDATE SET
        total_revenue = daily_summary.total_revenue + NEW.amount,
        updated_at = NOW();

    IF NEW.payment_type = 'consultation' THEN
        UPDATE public.daily_summary 
        SET consultation_revenue = consultation_revenue + NEW.amount
        WHERE summary_date = DATE(NEW.paid_at);
    ELSIF NEW.payment_type = 'drug' THEN
        UPDATE public.daily_summary 
        SET drug_revenue = drug_revenue + NEW.amount
        WHERE summary_date = DATE(NEW.paid_at);
    ELSIF NEW.payment_type IN ('glasses_deposit', 'glasses_balance') THEN
        UPDATE public.daily_summary 
        SET glasses_revenue = glasses_revenue + NEW.amount
        WHERE summary_date = DATE(NEW.paid_at);
    ELSIF NEW.payment_type = 'subscription' THEN
        UPDATE public.daily_summary 
        SET subscription_revenue = subscription_revenue + NEW.amount
        WHERE summary_date = DATE(NEW.paid_at);
    ELSE
        UPDATE public.daily_summary 
        SET other_revenue = other_revenue + NEW.amount
        WHERE summary_date = DATE(NEW.paid_at);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_update_daily_summary 
    AFTER INSERT ON public.payments 
    FOR EACH ROW EXECUTE FUNCTION update_daily_summary_on_payment();

-- Update daily summary when appointment status changes
CREATE OR REPLACE FUNCTION update_daily_summary_on_appointment()
RETURNS TRIGGER
AS $$
BEGIN
    INSERT INTO public.daily_summary (summary_date)
    VALUES (DATE(NEW.created_at))
    ON CONFLICT (summary_date) DO NOTHING;

    IF TG_OP = 'INSERT' THEN
        UPDATE public.daily_summary 
        SET total_appointments = total_appointments + 1
        WHERE summary_date = DATE(NEW.created_at);
    END IF;

    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE public.daily_summary 
        SET completed_appointments = completed_appointments + 1
        WHERE summary_date = DATE(NEW.created_at);
    ELSIF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        UPDATE public.daily_summary 
        SET cancelled_appointments = cancelled_appointments + 1
        WHERE summary_date = DATE(NEW.created_at);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER appointment_update_daily_summary 
    AFTER INSERT OR UPDATE ON public.appointments 
    FOR EACH ROW EXECUTE FUNCTION update_daily_summary_on_appointment();

SELECT 'Payment triggers created' as status;

-- =============================================
-- STEP 11: COMMUNICATION TRIGGERS
-- =============================================

-- Audit trigger function (FIXED: dynamic PK detection)
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER
AS $$
DECLARE
    target_id TEXT;
    pk_column TEXT;
BEGIN
    -- Dynamically get the primary key column name for this table
    SELECT a.attname INTO pk_column
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = TG_RELID AND i.indisprimary;

    -- Get the record ID using the dynamic PK column
    IF TG_OP = 'DELETE' THEN
        EXECUTE format('SELECT ($1).%I::TEXT', pk_column) USING OLD INTO target_id;
    ELSE
        EXECUTE format('SELECT ($1).%I::TEXT', pk_column) USING NEW INTO target_id;
    END IF;

    -- Insert audit log
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        target_id,
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
    );

    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply audit triggers
CREATE TRIGGER audit_profiles AFTER INSERT OR UPDATE OR DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
CREATE TRIGGER audit_patients AFTER INSERT OR UPDATE OR DELETE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
CREATE TRIGGER audit_appointments AFTER INSERT OR UPDATE OR DELETE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
CREATE TRIGGER audit_case_notes AFTER INSERT OR UPDATE OR DELETE ON public.case_notes FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
CREATE TRIGGER audit_prescriptions AFTER INSERT OR UPDATE OR DELETE ON public.prescriptions FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
CREATE TRIGGER audit_drugs AFTER INSERT OR UPDATE OR DELETE ON public.drugs FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
CREATE TRIGGER audit_glasses_inventory AFTER INSERT OR UPDATE OR DELETE ON public.glasses_inventory FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
CREATE TRIGGER audit_inventory_others AFTER INSERT OR UPDATE OR DELETE ON public.inventory_others FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
CREATE TRIGGER audit_drug_dispensing AFTER INSERT OR UPDATE OR DELETE ON public.drug_dispensing FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
CREATE TRIGGER audit_inventory_dispensing AFTER INSERT OR UPDATE OR DELETE ON public.inventory_dispensing FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
CREATE TRIGGER audit_glasses_orders AFTER INSERT OR UPDATE OR DELETE ON public.glasses_orders FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
CREATE TRIGGER audit_payments AFTER INSERT OR UPDATE OR DELETE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
CREATE TRIGGER audit_subscriptions AFTER INSERT OR UPDATE OR DELETE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
CREATE TRIGGER audit_invoices AFTER INSERT OR UPDATE OR DELETE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
CREATE TRIGGER audit_daily_summary AFTER INSERT OR UPDATE OR DELETE ON public.daily_summary FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
CREATE TRIGGER audit_messages AFTER INSERT OR UPDATE OR DELETE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
CREATE TRIGGER audit_notifications AFTER INSERT OR UPDATE OR DELETE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
CREATE TRIGGER audit_outreach_log AFTER INSERT OR UPDATE OR DELETE ON public.outreach_log FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
CREATE TRIGGER audit_settings AFTER INSERT OR UPDATE OR DELETE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
CREATE TRIGGER audit_push_subscriptions AFTER INSERT OR UPDATE OR DELETE ON public.push_subscriptions FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Auto-mark messages as read trigger
CREATE OR REPLACE FUNCTION mark_message_read()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_read = TRUE AND OLD.is_read = FALSE THEN
        NEW.read_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER message_mark_read
    BEFORE UPDATE ON public.messages
    FOR EACH ROW EXECUTE FUNCTION mark_message_read();

SELECT 'Communication triggers created' as status;

-- =============================================
-- STEP 12: TIMESTAMP TRIGGERS
-- =============================================

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_case_notes_updated_at BEFORE UPDATE ON public.case_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON public.prescriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_drugs_updated_at BEFORE UPDATE ON public.drugs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_glasses_inventory_updated_at BEFORE UPDATE ON public.glasses_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_others_updated_at BEFORE UPDATE ON public.inventory_others FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_glasses_orders_updated_at BEFORE UPDATE ON public.glasses_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_summary_updated_at BEFORE UPDATE ON public.daily_summary FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON public.push_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT 'Timestamp triggers created' as status;

-- =============================================
-- STEP 13: RLS POLICIES
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "profiles_select_all_active" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_trigger" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_manage" ON public.profiles;
DROP POLICY IF EXISTS "read_case_notes" ON public.case_notes;
DROP POLICY IF EXISTS "insert_case_notes" ON public.case_notes;
DROP POLICY IF EXISTS "update_case_notes" ON public.case_notes;
DROP POLICY IF EXISTS "delete_case_notes" ON public.case_notes;
DROP POLICY IF EXISTS "read_own_messages" ON public.messages;
DROP POLICY IF EXISTS "send_messages" ON public.messages;
DROP POLICY IF EXISTS "delete_own_messages" ON public.messages;
DROP POLICY IF EXISTS "read_appointments" ON public.appointments;
DROP POLICY IF EXISTS "insert_appointments" ON public.appointments;
DROP POLICY IF EXISTS "update_appointments" ON public.appointments;
DROP POLICY IF EXISTS "delete_appointments" ON public.appointments;
DROP POLICY IF EXISTS "read_patients" ON public.patients;
DROP POLICY IF EXISTS "insert_patients" ON public.patients;
DROP POLICY IF EXISTS "update_patients" ON public.patients;
DROP POLICY IF EXISTS "delete_patients" ON public.patients;
DROP POLICY IF EXISTS "read_prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "insert_prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "update_prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "delete_prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "read_drug_dispensing" ON public.drug_dispensing;
DROP POLICY IF EXISTS "insert_drug_dispensing" ON public.drug_dispensing;
DROP POLICY IF EXISTS "update_drug_dispensing" ON public.drug_dispensing;
DROP POLICY IF EXISTS "delete_drug_dispensing" ON public.drug_dispensing;
DROP POLICY IF EXISTS "read_payments" ON public.payments;
DROP POLICY IF EXISTS "insert_payments" ON public.payments;
DROP POLICY IF EXISTS "update_payments" ON public.payments;
DROP POLICY IF EXISTS "delete_payments" ON public.payments;
DROP POLICY IF EXISTS "read_glasses_inventory" ON public.glasses_inventory;
DROP POLICY IF EXISTS "insert_glasses_inventory" ON public.glasses_inventory;
DROP POLICY IF EXISTS "update_glasses_inventory" ON public.glasses_inventory;
DROP POLICY IF EXISTS "delete_glasses_inventory" ON public.glasses_inventory;
DROP POLICY IF EXISTS "read_glasses_orders" ON public.glasses_orders;
DROP POLICY IF EXISTS "insert_glasses_orders" ON public.glasses_orders;
DROP POLICY IF EXISTS "update_glasses_orders" ON public.glasses_orders;
DROP POLICY IF EXISTS "delete_glasses_orders" ON public.glasses_orders;
DROP POLICY IF EXISTS "read_drugs" ON public.drugs;
DROP POLICY IF EXISTS "insert_drugs" ON public.drugs;
DROP POLICY IF EXISTS "update_drugs" ON public.drugs;
DROP POLICY IF EXISTS "delete_drugs" ON public.drugs;
DROP POLICY IF EXISTS "inventory_others_select" ON public.inventory_others;
DROP POLICY IF EXISTS "inventory_others_insert" ON public.inventory_others;
DROP POLICY IF EXISTS "inventory_others_update" ON public.inventory_others;
DROP POLICY IF EXISTS "inventory_others_delete" ON public.inventory_others;
DROP POLICY IF EXISTS "inventory_dispensing_select" ON public.inventory_dispensing;
DROP POLICY IF EXISTS "inventory_dispensing_insert" ON public.inventory_dispensing;
DROP POLICY IF EXISTS "inventory_dispensing_update" ON public.inventory_dispensing;
DROP POLICY IF EXISTS "inventory_dispensing_delete" ON public.inventory_dispensing;

-- Profiles policies (FIXED: Allow proper user management)
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "profiles_update_own_or_admin" ON public.profiles FOR UPDATE TO authenticated USING (
    id = auth.uid() OR 
    get_user_role() IN ('admin', 'manager')
);
CREATE POLICY "profiles_delete_admin_only" ON public.profiles FOR DELETE TO authenticated USING (
    get_user_role() = 'admin'
);

-- Case notes policies
CREATE POLICY "read_case_notes" ON public.case_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_case_notes" ON public.case_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_case_notes" ON public.case_notes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_case_notes" ON public.case_notes FOR DELETE TO authenticated USING (
    get_user_role() = 'admin' OR doctor_id = auth.uid()
);

-- Messages policies
CREATE POLICY "read_own_messages" ON public.messages FOR SELECT TO authenticated USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "send_messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
CREATE POLICY "delete_own_messages" ON public.messages FOR DELETE TO authenticated USING (sender_id = auth.uid());

-- Appointments policies
CREATE POLICY "read_appointments" ON public.appointments FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_appointments" ON public.appointments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_appointments" ON public.appointments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_appointments" ON public.appointments FOR DELETE TO authenticated USING (
    get_user_role() = 'admin' OR doctor_id = auth.uid()
);

-- Patients policies (FIXED: Allow admin and frontdesk to delete patients)
CREATE POLICY "read_patients" ON public.patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_patients" ON public.patients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_patients" ON public.patients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_patients_admin_frontdesk" ON public.patients FOR DELETE TO authenticated USING (
    get_user_role() IN ('admin', 'frontdesk')
);
-- Allow service role to delete patients (for admin operations)
CREATE POLICY "delete_patients_service" ON public.patients FOR DELETE TO service_role USING (true);

-- Prescriptions policies
CREATE POLICY "read_prescriptions" ON public.prescriptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_prescriptions" ON public.prescriptions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_prescriptions" ON public.prescriptions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_prescriptions" ON public.prescriptions FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- Drug dispensing policies
CREATE POLICY "read_drug_dispensing" ON public.drug_dispensing FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_drug_dispensing" ON public.drug_dispensing FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_drug_dispensing" ON public.drug_dispensing FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_drug_dispensing" ON public.drug_dispensing FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- Payments policies
CREATE POLICY "read_payments" ON public.payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_payments" ON public.payments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_payments" ON public.payments FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- Glasses inventory policies
CREATE POLICY "read_glasses_inventory" ON public.glasses_inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_glasses_inventory" ON public.glasses_inventory FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_glasses_inventory" ON public.glasses_inventory FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_glasses_inventory" ON public.glasses_inventory FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- Glasses orders policies
CREATE POLICY "read_glasses_orders" ON public.glasses_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_glasses_orders" ON public.glasses_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_glasses_orders" ON public.glasses_orders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_glasses_orders" ON public.glasses_orders FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- Drugs policies
CREATE POLICY "read_drugs" ON public.drugs FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_drugs" ON public.drugs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_drugs" ON public.drugs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_drugs" ON public.drugs FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- Inventory others policies
CREATE POLICY "inventory_others_select" ON public.inventory_others FOR SELECT TO authenticated USING (true);
CREATE POLICY "inventory_others_insert" ON public.inventory_others FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "inventory_others_update" ON public.inventory_others FOR UPDATE TO authenticated USING (true);
CREATE POLICY "inventory_others_delete" ON public.inventory_others FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- Inventory dispensing policies
CREATE POLICY "inventory_dispensing_select" ON public.inventory_dispensing FOR SELECT TO authenticated USING (true);
CREATE POLICY "inventory_dispensing_insert" ON public.inventory_dispensing FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "inventory_dispensing_update" ON public.inventory_dispensing FOR UPDATE TO authenticated USING (true);
CREATE POLICY "inventory_dispensing_delete" ON public.inventory_dispensing FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- Daily summary policies (for triggers)
CREATE POLICY "daily_summary_select" ON public.daily_summary FOR SELECT TO authenticated USING (true);
CREATE POLICY "daily_summary_insert" ON public.daily_summary FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "daily_summary_update" ON public.daily_summary FOR UPDATE TO authenticated USING (true);

-- Audit logs policies (for triggers)
CREATE POLICY "audit_logs_insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "audit_logs_select" ON public.audit_logs FOR SELECT TO authenticated USING (get_user_role() = 'admin');

SELECT 'RLS policies created' as status;

-- =============================================
-- STEP 14: REALTIME PUBLICATION
-- =============================================

DO $$
BEGIN
    -- Add tables to realtime publication
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.case_notes; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.prescriptions; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.messages; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.drugs; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.glasses_inventory; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.glasses_orders; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

SELECT 'Realtime configured' as status;

-- =============================================
-- STEP 15: DEFAULT SETTINGS
-- =============================================

INSERT INTO public.settings (key, value, description, category, is_public) VALUES
('clinic_name', 'KORENE Eye Clinic', 'Name of the eye clinic', 'general', true),
('clinic_phone', '+1234567890', 'Main clinic phone number', 'general', true),
('clinic_email', 'info@koreneeyeclinic.com', 'Main clinic email', 'general', true),
('clinic_address', '123 Clinic Street, City, Country', 'Clinic physical address', 'general', true),
('appointment_reminder_hours', '24', 'Hours before appointment to send reminder', 'appointments', false),
('low_stock_threshold', '10', 'Threshold for low stock alerts', 'inventory', false),
('enable_sms_notifications', 'true', 'Enable SMS notifications', 'notifications', false),
('enable_email_notifications', 'true', 'Enable email notifications', 'notifications', false),
('message_retention_days', '365', 'Days to retain messages', 'messaging', false),
('max_file_upload_size', '10', 'Maximum file upload size in MB', 'messaging', false),
('appointment_duration_minutes', '30', 'Default appointment duration in minutes', 'appointments', false),
('appointment_buffer_minutes', '15', 'Buffer time between appointments', 'appointments', false),
('low_stock_alert_enabled', 'true', 'Enable low stock alerts', 'inventory', false),
('payment_receipt_prefix', 'REC-', 'Prefix for payment receipt numbers', 'payments', false),
('patient_number_prefix', 'PAT-', 'Prefix for patient numbers', 'general', false),
('backup_retention_days', '30', 'Days to retain backup files', 'general', false),
('notification_sound_enabled', 'true', 'Enable notification sounds', 'notifications', false),
('auto_logout_minutes', '60', 'Auto logout after inactivity', 'general', false),
('max_appointments_per_day', '20', 'Maximum appointments per day per doctor', 'appointments', false),
('enable_sms_reminders', 'true', 'Enable SMS appointment reminders', 'notifications', false)
ON CONFLICT (key) DO NOTHING;

SELECT 'Default settings inserted' as status;

-- =============================================
-- STEP 16: SERVICE ROLE PERMISSIONS & RATE LIMITING FIXES
-- =============================================

-- Grant service role necessary permissions for admin operations (FIXED: User deletion)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Create function to check if user is staff (for rate limiting bypass)
CREATE OR REPLACE FUNCTION public.is_staff_account(user_email TEXT) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN auth.users u ON u.id = p.id
        WHERE u.email = user_email AND p.is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced settings for rate limiting and authentication (FIXED: Limit exceeded errors)
INSERT INTO public.settings (key, value, description, category, is_public) VALUES
('max_concurrent_users', '100', 'Maximum concurrent users allowed', 'general', false),
('session_timeout_minutes', '480', 'Session timeout in minutes (8 hours)', 'general', false),
('enable_staff_bypass_rate_limit', 'true', 'Allow staff to bypass rate limits', 'general', false),
('max_login_attempts', '20', 'Maximum login attempts before rate limit', 'security', false),
('login_block_duration_minutes', '5', 'Duration to block after too many attempts', 'security', false),
('max_registration_attempts', '10', 'Maximum registration attempts per hour', 'security', false),
('registration_block_duration_minutes', '30', 'Duration to block registration after limit', 'security', false)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();

-- Create rate limiting table if it doesn't exist (for future use)
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier TEXT NOT NULL,
    attempt_count INTEGER DEFAULT 1,
    first_attempt TIMESTAMPTZ DEFAULT NOW(),
    last_attempt TIMESTAMPTZ DEFAULT NOW(),
    blocked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for rate_limits table
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rate_limits_service_only" ON public.rate_limits FOR ALL TO service_role USING (true);

SELECT 'Service role permissions and rate limiting fixes applied' as status;

-- =============================================
-- STEP 17: SEED DATA (Optional - for testing)
-- =============================================

-- Sample patients
INSERT INTO public.patients (patient_number, first_name, last_name, date_of_birth, gender, phone, email, address, occupation, next_of_kin_name, next_of_kin_phone, allergies)
VALUES
('PAT-001', 'John', 'Smith', '1985-03-15', 'male', '+1234567890', 'john.smith@email.com', '123 Main St, City, State', 'Software Engineer', 'Jane Smith', '+1234567891', 'Penicillin'),
('PAT-002', 'Sarah', 'Johnson', '1990-07-22', 'female', '+1234567892', 'sarah.j@email.com', '456 Oak Ave, City, State', 'Teacher', 'Mike Johnson', '+1234567893', 'None'),
('PAT-003', 'Michael', 'Brown', '1978-11-08', 'male', '+1234567894', 'michael.b@email.com', '789 Pine Rd, City, State', 'Accountant', 'Lisa Brown', '+1234567895', 'Latex'),
('PAT-004', 'Emily', 'Davis', '1995-02-14', 'female', '+1234567896', 'emily.d@email.com', '321 Elm St, City, State', 'Nurse', 'Robert Davis', '+1234567897', 'Dust'),
('PAT-005', 'David', 'Wilson', '1982-09-30', 'male', '+1234567898', 'david.w@email.com', '654 Maple Dr, City, State', 'Sales Manager', 'Susan Wilson', '+1234567899', 'None')
ON CONFLICT (patient_number) DO NOTHING;

-- Sample drugs
INSERT INTO public.drugs (name, generic_name, category, unit, quantity, reorder_level, purchase_price, selling_price, supplier, expiry_date, batch_number, storage_location)
VALUES
('Tobramycin Eye Drops', 'Tobramycin', 'Antibiotics', 'bottle', 50, 10, 8.50, 15.00, 'PharmaCorp', '2025-12-31', 'B001', 'Refrigerator'),
('Artificial Tears', 'Carboxymethylcellulose', 'Lubricants', 'bottle', 100, 20, 3.25, 8.00, 'EyeCare Inc', '2026-03-15', 'B002', 'Room Temperature'),
('Prednisolone Acetate', 'Prednisolone', 'Steroids', 'bottle', 30, 8, 12.75, 25.00, 'PharmaCorp', '2025-08-20', 'B003', 'Refrigerator'),
('Latanoprost', 'Latanoprost', 'Glaucoma', 'bottle', 25, 5, 45.00, 85.00, 'GlaucomaTech', '2025-11-30', 'B004', 'Refrigerator'),
('Cyclopentolate', 'Cyclopentolate', 'Mydriatics', 'bottle', 40, 10, 15.50, 30.00, 'EyeCare Inc', '2026-01-15', 'B005', 'Room Temperature')
ON CONFLICT DO NOTHING;

-- Sample glasses inventory
INSERT INTO public.glasses_inventory (frame_name, frame_brand, frame_code, color, material, gender, frame_type, size, quantity, reorder_level, purchase_price, selling_price, supplier)
VALUES
('Classic Aviator', 'Ray-Ban', 'RB001', 'Gold', 'Metal', 'unisex', 'full', 'Medium', 15, 3, 45.00, 120.00, 'Optical Supplies'),
('Round Vintage', 'Warby Parker', 'WP002', 'Black', 'Acetate', 'unisex', 'full', 'Small', 20, 4, 35.00, 95.00, 'Optical Supplies'),
('Sport Wrap', 'Oakley', 'OK003', 'Red', 'Plastic', 'male', 'full', 'Large', 10, 2, 55.00, 150.00, 'Sport Optics'),
('Cat Eye', 'Gucci', 'GC004', 'Tortoise', 'Acetate', 'female', 'full', 'Medium', 12, 3, 125.00, 280.00, 'Luxury Eyewear'),
('Rectangle Modern', 'Tom Ford', 'TF005', 'Gunmetal', 'Metal', 'unisex', 'full', 'Large', 8, 2, 85.00, 200.00, 'Luxury Eyewear')
ON CONFLICT DO NOTHING;

-- Sample other inventory items
INSERT INTO public.inventory_others (name, category, description, unit, quantity, reorder_level, purchase_price, selling_price, supplier, storage_location)
VALUES
('Contact Lens Solution', 'Contact Care', 'Multipurpose solution for contact lenses', 'bottle', 75, 15, 4.50, 12.00, 'LensCare Inc', 'Room Temperature'),
('Eye Patch', 'Medical Supplies', 'Disposable eye patches', 'pack', 100, 20, 2.00, 5.00, 'Medical Supplies Co', 'Drawer 1'),
('Eye Drops Applicator', 'Accessories', 'Reusable eye drops applicator', 'piece', 50, 10, 1.50, 4.00, 'Medical Supplies Co', 'Drawer 2'),
('Lens Cleaning Cloth', 'Accessories', 'Microfiber lens cleaning cloth', 'piece', 200, 30, 0.50, 2.00, 'Optical Supplies', 'Shelf A'),
('Eye Chart', 'Equipment', 'Standard Snellen eye chart', 'piece', 5, 1, 15.00, 35.00, 'Medical Equipment', 'Wall Mount')
ON CONFLICT DO NOTHING;

SELECT 'Seed data inserted' as status;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

SELECT 'DATABASE SETUP COMPLETE! All tables, policies, triggers, seed data, and CRITICAL FIXES have been applied successfully.' as status;
SELECT 'FIXES APPLIED: User deletion, RLS policies, rate limiting, authentication, and service role permissions.' as summary;
