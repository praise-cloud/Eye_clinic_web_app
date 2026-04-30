-- =============================================
-- EYE CLINIC - FIX: daily_summary RLS Error
-- =============================================
-- Run this in Supabase SQL Editor to fix the error:
-- "ALTER action ENABLE ROW LEVEL SECURITY cannot be performed on relation daily_summary"
-- =============================================

-- Step 1: Drop daily_summary as VIEW (the root cause of the error)
DROP VIEW IF EXISTS public.daily_summary CASCADE;

-- Step 2: Drop as TABLE if exists (clean slate)
DROP TABLE IF EXISTS public.daily_summary;

-- Step 3: Recreate as TABLE (required for RLS)
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

-- Step 4: Now ENABLE ROW LEVEL SECURITY is safe (it's a table, not a view)
ALTER TABLE public.daily_summary ENABLE ROW LEVEL SECURITY;

-- Step 5: Add RLS policy
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'daily_summary' AND policyname = 'Admin manage daily summary') THEN
    CREATE POLICY "Admin manage daily summary" ON public.daily_summary
      FOR ALL TO authenticated
      USING (get_user_role() = 'admin')
      WITH CHECK (get_user_role() = 'admin');
  END IF;
END $$;

-- Done! The error should be fixed.
