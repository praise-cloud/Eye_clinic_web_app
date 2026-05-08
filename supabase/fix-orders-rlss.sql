-- Fix RLS policies for glasses_orders, inventory_dispensing, inventory_others
-- Run EACH statement separately in Supabase SQL Editor.

-- 1. Glasses Orders table
-- Drop old policies if they exist
DROP POLICY IF EXISTS "glasses_orders_insert" ON public.glasses_orders;
DROP POLICY IF EXISTS "glasses_orders_select" ON public.glasses_orders;
DROP POLICY IF EXISTS "glasses_orders_update_own" ON public.glasses_orders;
DROP POLICY IF EXISTS "glasses_orders_delete_own" ON public.glasses_orders;

-- Create new policies for glasses_orders
CREATE POLICY "glasses_orders_insert" ON public.glasses_orders 
    FOR INSERT TO authenticated 
    WITH CHECK (true);

CREATE POLICY "glasses_orders_select" ON public.glasses_orders 
    FOR SELECT TO authenticated 
    USING (true);

CREATE POLICY "glasses_orders_update_own" ON public.glasses_orders 
    FOR UPDATE TO authenticated 
    USING (created_by = auth.uid()) 
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "glasses_orders_delete_own" ON public.glasses_orders 
    FOR DELETE TO authenticated 
    USING (created_by = auth.uid());

-- 2. Inventory Dispensing table
DROP POLICY IF EXISTS "inventory_dispensing_insert" ON public.inventory_dispensing;
DROP POLICY IF EXISTS "inventory_dispensing_select" ON public.inventory_dispensing;

CREATE POLICY "inventory_dispensing_insert" ON public.inventory_dispensing 
    FOR INSERT TO authenticated 
    WITH CHECK (true);

CREATE POLICY "inventory_dispensing_select" ON public.inventory_dispensing 
    FOR SELECT TO authenticated 
    USING (true);

-- 3. Inventory Others table (for item selection)
DROP POLICY IF EXISTS "inventory_others_select" ON public.inventory_others;
DROP POLICY IF EXISTS "inventory_others_update" ON public.inventory_others;

CREATE POLICY "inventory_others_select" ON public.inventory_others 
    FOR SELECT TO authenticated 
    USING (true);

CREATE POLICY "inventory_others_update" ON public.inventory_others 
    FOR UPDATE TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- 4. Glasses Inventory table (for frame selection)
DROP POLICY IF EXISTS "glasses_inventory_select" ON public.glasses_inventory;
DROP POLICY IF EXISTS "glasses_inventory_update" ON public.glasses_inventory;

CREATE POLICY "glasses_inventory_select" ON public.glasses_inventory 
    FOR SELECT TO authenticated 
    USING (true);

CREATE POLICY "glasses_inventory_update" ON public.glasses_inventory 
    FOR UPDATE TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- 5. Drugs table (for drug dispensing)
DROP POLICY IF EXISTS "drugs_select" ON public.drugs;
DROP POLICY IF EXISTS "drugs_update" ON public.drugs;

CREATE POLICY "drugs_select" ON public.drugs 
    FOR SELECT TO authenticated 
    USING (true);

CREATE POLICY "drugs_update" ON public.drugs 
    FOR UPDATE TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- Verify policies were created
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('glasses_orders', 'inventory_dispensing', 'inventory_others', 'glasses_inventory', 'drugs')
ORDER BY tablename, cmd;
