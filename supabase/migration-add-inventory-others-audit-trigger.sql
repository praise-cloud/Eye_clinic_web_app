-- Migration: Add audit trigger for inventory_others table
-- Run this in Supabase SQL Editor if audit trigger wasn't added by schema.sql
DROP TRIGGER IF EXISTS audit_inventory_others ON public.inventory_others;
CREATE TRIGGER audit_inventory_others
AFTER
INSERT
  OR
UPDATE
  OR DELETE ON public.inventory_others FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();