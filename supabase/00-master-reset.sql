-- =============================================
-- EYE CLINIC DATABASE - MASTER RESET & SETUP
-- Run this ONCE to fix all database issues
-- =============================================

-- =============================================
-- STEP 1: CLEAN SLATE (Drop everything)
-- =============================================

-- Drop ALL triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS audit_messages ON public.messages;
DROP TRIGGER IF EXISTS audit_notifications ON public.notifications;
DROP TRIGGER IF EXISTS audit_outreach_log ON public.outreach_log;
DROP TRIGGER IF EXISTS audit_settings ON public.settings;
DROP TRIGGER IF EXISTS audit_push_subscriptions ON public.push_subscriptions;
DROP TRIGGER IF EXISTS audit_patients ON public.patients;
DROP TRIGGER IF EXISTS audit_appointments ON public.appointments;
DROP TRIGGER IF EXISTS audit_case_notes ON public.case_notes;
DROP TRIGGER IF EXISTS audit_prescriptions ON public.prescriptions;
DROP TRIGGER IF EXISTS audit_drugs ON public.drugs;
DROP TRIGGER IF EXISTS audit_glasses_inventory ON public.glasses_inventory;
DROP TRIGGER IF EXISTS audit_inventory_others ON public.inventory_others;
DROP TRIGGER IF EXISTS audit_drug_dispensing ON public.drug_dispensing;
DROP TRIGGER IF EXISTS audit_inventory_dispensing ON public.inventory_dispensing;
DROP TRIGGER IF EXISTS audit_glasses_orders ON public.glasses_orders;
DROP TRIGGER IF EXISTS audit_payments ON public.payments;
DROP TRIGGER IF EXISTS audit_subscriptions ON public.subscriptions;
DROP TRIGGER IF EXISTS audit_invoices ON public.invoices;
DROP TRIGGER IF EXISTS audit_daily_summary ON public.daily_summary;
DROP TRIGGER IF EXISTS audit_logs ON public.audit_logs;
DROP TRIGGER IF EXISTS payment_update_daily_summary ON public.payments;
DROP TRIGGER IF EXISTS appointment_update_daily_summary ON public.appointments;
DROP TRIGGER IF EXISTS drug_dispensing_update_quantity ON public.drug_dispensing;
DROP TRIGGER IF EXISTS inventory_dispensing_update_quantity ON public.inventory_dispensing;
DROP TRIGGER IF EXISTS glasses_orders_update_quantity ON public.glasses_orders;
DROP TRIGGER IF EXISTS message_mark_read ON public.messages;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_patients_updated_at ON public.patients;
DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
DROP TRIGGER IF EXISTS update_case_notes_updated_at ON public.case_notes;
DROP TRIGGER IF EXISTS update_prescriptions_updated_at ON public.prescriptions;
DROP TRIGGER IF EXISTS update_drugs_updated_at ON public.drugs;
DROP TRIGGER IF EXISTS update_glasses_inventory_updated_at ON public.glasses_inventory;
DROP TRIGGER IF EXISTS update_inventory_others_updated_at ON public.inventory_others;
DROP TRIGGER IF EXISTS update_glasses_orders_updated_at ON public.glasses_orders;
DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
DROP TRIGGER IF EXISTS update_daily_summary_updated_at ON public.daily_summary;
DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
DROP TRIGGER IF EXISTS update_push_subscriptions_updated_at ON public.push_subscriptions;
DROP TRIGGER IF EXISTS update_settings_updated_at ON public.settings;

-- Drop ALL functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS get_user_role();
DROP FUNCTION IF EXISTS get_current_profile();
DROP FUNCTION IF EXISTS public.audit_trigger_function();
DROP FUNCTION IF EXISTS mark_message_read();
DROP FUNCTION IF EXISTS update_drug_quantity_on_dispensing();
DROP FUNCTION IF EXISTS update_inventory_others_quantity_on_dispensing();
DROP FUNCTION IF EXISTS update_glasses_quantity_on_order();
DROP FUNCTION IF EXISTS update_daily_summary_on_payment();
DROP FUNCTION IF EXISTS update_daily_summary_on_appointment();

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
