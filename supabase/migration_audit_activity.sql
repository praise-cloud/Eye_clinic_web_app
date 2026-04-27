-- ============================================================
-- Audit Logs & Activity Tracking Migration
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Add last_login column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- 2. Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_func() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_data)
    VALUES (auth.uid(), TG_OP || '_' || TG_TABLE_NAME, TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), TG_OP || '_' || TG_TABLE_NAME, TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data)
    VALUES (auth.uid(), TG_OP || '_' || TG_TABLE_NAME, TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create audit triggers for key tables
DROP TRIGGER IF EXISTS audit_patients_trigger ON public.patients;
CREATE TRIGGER audit_patients_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_appointments_trigger ON public.appointments;
CREATE TRIGGER audit_appointments_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_drugs_trigger ON public.drugs;
CREATE TRIGGER audit_drugs_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.drugs
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_payments_trigger ON public.payments;
CREATE TRIGGER audit_payments_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_profiles_trigger ON public.profiles;
CREATE TRIGGER audit_profiles_trigger
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- 4. Login tracking function
CREATE OR REPLACE FUNCTION track_login() RETURNS TRIGGER AS $$
BEGIN
  IF OLD IS DISTINCT FROM NEW THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_data)
    VALUES (NEW.id, 'login_profiles', 'profiles', NEW.id, jsonb_build_object('full_name', NEW.full_name));
    UPDATE public.profiles SET last_login = NOW() WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS track_login_trigger ON public.profiles;
CREATE TRIGGER track_login_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION track_login();