-- Add audit triggers for all business tables missing them
-- Run this in Supabase SQL Editor after fix-notifications-policy.sql

-- Core tables (01-core-schema.sql)
DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
CREATE TRIGGER audit_profiles
    AFTER INSERT OR UPDATE OR DELETE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_patients ON public.patients;
CREATE TRIGGER audit_patients
    AFTER INSERT OR UPDATE OR DELETE ON public.patients
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_appointments ON public.appointments;
CREATE TRIGGER audit_appointments
    AFTER INSERT OR UPDATE OR DELETE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_case_notes ON public.case_notes;
CREATE TRIGGER audit_case_notes
    AFTER INSERT OR UPDATE OR DELETE ON public.case_notes
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_prescriptions ON public.prescriptions;
CREATE TRIGGER audit_prescriptions
    AFTER INSERT OR UPDATE OR DELETE ON public.prescriptions
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Inventory tables (02-inventory-schema.sql)
DROP TRIGGER IF EXISTS audit_drugs ON public.drugs;
CREATE TRIGGER audit_drugs
    AFTER INSERT OR UPDATE OR DELETE ON public.drugs
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_glasses_inventory ON public.glasses_inventory;
CREATE TRIGGER audit_glasses_inventory
    AFTER INSERT OR UPDATE OR DELETE ON public.glasses_inventory
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_inventory_others ON public.inventory_others;
CREATE TRIGGER audit_inventory_others
    AFTER INSERT OR UPDATE OR DELETE ON public.inventory_others
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_drug_dispensing ON public.drug_dispensing;
CREATE TRIGGER audit_drug_dispensing
    AFTER INSERT OR UPDATE OR DELETE ON public.drug_dispensing
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_inventory_dispensing ON public.inventory_dispensing;
CREATE TRIGGER audit_inventory_dispensing
    AFTER INSERT OR UPDATE OR DELETE ON public.inventory_dispensing
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_glasses_orders ON public.glasses_orders;
CREATE TRIGGER audit_glasses_orders
    AFTER INSERT OR UPDATE OR DELETE ON public.glasses_orders
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Payment tables (03-payments-schema.sql)
DROP TRIGGER IF EXISTS audit_payments ON public.payments;
CREATE TRIGGER audit_payments
    AFTER INSERT OR UPDATE OR DELETE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_subscriptions ON public.subscriptions;
CREATE TRIGGER audit_subscriptions
    AFTER INSERT OR UPDATE OR DELETE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_invoices ON public.invoices;
CREATE TRIGGER audit_invoices
    AFTER INSERT OR UPDATE OR DELETE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Verify all audit triggers are registered
SELECT trigger_name, event_object_table, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE 'audit_%'
ORDER BY event_object_table, event_manipulation;

SELECT 'Audit triggers created for all business tables' as status;
