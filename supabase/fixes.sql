-- =============================================
-- QUICK FIXES FOR 3 ISSUES
-- Run this in Supabase SQL Editor
-- =============================================

-- =============================================
-- ISSUE 1: GLASSES NOT DELETING
-- Fix glasses_orders.frame_id to use ON DELETE SET NULL
-- =============================================

-- Drop existing foreign key constraint
ALTER TABLE public.glasses_orders 
DROP CONSTRAINT IF EXISTS glasses_orders_frame_id_fkey;

-- Re-add with ON DELETE SET NULL
ALTER TABLE public.glasses_orders 
ADD CONSTRAINT glasses_orders_frame_id_fkey 
FOREIGN KEY (frame_id) 
REFERENCES public.glasses_inventory(id) 
ON DELETE SET NULL;

-- Ensure RLS policy allows delete for glasses_inventory
DROP POLICY IF EXISTS "Frontdesk/admin manage glasses" ON public.glasses_inventory;
CREATE POLICY "Frontdesk/admin manage glasses" ON public.glasses_inventory 
FOR ALL TO authenticated 
USING (get_user_role() IN ('frontdesk', 'admin')) 
WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));

-- =============================================
-- ISSUE 2: INVENTORY ITEMS NOT ADDING
-- Fix RLS policy for inventory_others
-- =============================================

-- Drop and recreate the policy with proper permissions
DROP POLICY IF EXISTS "Frontdesk/admin manage inventory others" ON public.inventory_others;
CREATE POLICY "Frontdesk/admin manage inventory others" ON public.inventory_others 
FOR ALL TO authenticated 
USING (get_user_role() IN ('frontdesk', 'admin')) 
WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));

-- Also ensure INSERT policy exists for inserting new items
DROP POLICY IF EXISTS "Frontdesk/admin insert inventory others" ON public.inventory_others;
CREATE POLICY "Frontdesk/admin insert inventory others" ON public.inventory_others 
FOR INSERT TO authenticated 
WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));

-- =============================================
-- ISSUE 3: PAYMENT RECORDS NOT DELETING
-- Fix RLS policy for payments
-- =============================================

-- Drop and recreate the policy with DELETE permission
DROP POLICY IF EXISTS "Admin manage payments" ON public.payments;
CREATE POLICY "Admin manage payments" ON public.payments 
FOR ALL TO authenticated 
USING (get_user_role() = 'admin') 
WITH CHECK (get_user_role() = 'admin');

-- Also allow frontdesk to insert payments (needed for recording payments)
DROP POLICY IF EXISTS "Frontdesk insert payments" ON public.payments;
CREATE POLICY "Frontdesk insert payments" ON public.payments 
FOR INSERT TO authenticated 
WITH CHECK (get_user_role() IN ('frontdesk', 'admin'));

-- =============================================
-- VERIFICATION QUERIES
-- Run these to verify the fixes
-- =============================================

-- Check glasses_orders constraint
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'public.glasses_orders'::regclass 
AND conname = 'glasses_orders_frame_id_fkey';

-- Check RLS policies for inventory_others
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'inventory_others';

-- Check RLS policies for payments
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'payments';

-- Check RLS policies for glasses_inventory
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'glasses_inventory';

-- =============================================
-- END OF FIXES
-- =============================================
