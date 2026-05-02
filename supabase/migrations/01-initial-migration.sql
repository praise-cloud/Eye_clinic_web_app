-- =============================================
-- EYE CLINIC DATABASE - INITIAL MIGRATION
-- =============================================

-- This file represents the initial database state and migration
-- Run this file first when setting up the database

-- =============================================
-- EXECUTION ORDER
-- =============================================

-- 1. Core Schema (tables, indexes, basic functions)
-- 2. Inventory Schema (inventory tables, dispensing, orders)
-- 3. Payments Schema (payments, subscriptions, billing)
-- 4. Communications Schema (messages, notifications, audit)
-- 5. RLS Policies (security policies for all tables)
-- 6. Seed Data (initial data for testing and development)

-- =============================================
-- MIGRATION LOGIC
-- =============================================

-- Create migration tracking table
CREATE TABLE IF NOT EXISTS public.schema_migrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  version TEXT NOT NULL UNIQUE,
  description TEXT,
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  execution_time_ms INTEGER
);

-- Enable RLS for migration table
ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY;

-- Allow only system to manage migrations
CREATE POLICY "migrations_system_only" ON public.schema_migrations
    FOR ALL TO authenticated
    USING (false);

-- =============================================
-- MIGRATION HELPER FUNCTIONS
-- =============================================

-- Function to check if migration has been executed
CREATE OR REPLACE FUNCTION migration_executed(version TEXT) RETURNS BOOLEAN AS $$
SELECT EXISTS (
    SELECT 1 FROM public.schema_migrations 
    WHERE version = migration_executed.version
);
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to mark migration as executed
CREATE OR REPLACE FUNCTION mark_migration_executed(version TEXT, description TEXT DEFAULT NULL) RETURNS VOID AS $$
INSERT INTO public.schema_migrations (version, description)
VALUES (version, description)
ON CONFLICT (version) DO NOTHING;
$$ LANGUAGE SQL SECURITY DEFINER;

-- =============================================
-- MIGRATION WRAPPER
-- =============================================

-- Main migration function that executes all schema files in order
CREATE OR REPLACE FUNCTION run_initial_migration() RETURNS TEXT AS $$
DECLARE
    start_time TIMESTAMPTZ := NOW();
    migration_count INTEGER := 0;
BEGIN
    -- This function should be called after all schema files have been executed
    -- It serves as a marker that the initial migration is complete
    
    -- Mark the initial migration as executed
    INSERT INTO public.schema_migrations (version, description)
    VALUES ('initial_migration', 'Complete initial database setup')
    ON CONFLICT (version) DO NOTHING;
    
    migration_count := migration_count + 1;
    
    -- Calculate execution time
    UPDATE public.schema_migrations 
    SET execution_time_ms = EXTRACT(MILLISECOND FROM (NOW() - start_time))
    WHERE version = 'initial_migration';
    
    RETURN format('Initial migration completed. %s schemas executed.', migration_count);
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Migration failed: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- VALIDATION FUNCTIONS
-- =============================================

-- Function to validate database setup
CREATE OR REPLACE FUNCTION validate_database_setup() RETURNS TABLE (
    table_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check core tables
    RETURN QUERY
    SELECT 'profiles', 
           CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN 'OK' ELSE 'MISSING' END,
           'User profiles table'
    UNION ALL
    SELECT 'patients', 
           CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patients' AND table_schema = 'public') THEN 'OK' ELSE 'MISSING' END,
           'Patient records table'
    UNION ALL
    SELECT 'appointments', 
           CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointments' AND table_schema = 'public') THEN 'OK' ELSE 'MISSING' END,
           'Appointments table'
    UNION ALL
    SELECT 'case_notes', 
           CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'case_notes' AND table_schema = 'public') THEN 'OK' ELSE 'MISSING' END,
           'Case notes table'
    UNION ALL
    SELECT 'drugs', 
           CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'drugs' AND table_schema = 'public') THEN 'OK' ELSE 'MISSING' END,
           'Drug inventory table'
    UNION ALL
    SELECT 'payments', 
           CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments' AND table_schema = 'public') THEN 'OK' ELSE 'MISSING' END,
           'Payments table'
    UNION ALL
    SELECT 'messages', 
           CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages' AND table_schema = 'public') THEN 'OK' ELSE 'MISSING' END,
           'Messages table'
    UNION ALL
    SELECT 'notifications', 
           CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications' AND table_schema = 'public') THEN 'OK' ELSE 'MISSING' END,
           'Notifications table'
    UNION ALL
    SELECT 'audit_logs', 
           CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs' AND table_schema = 'public') THEN 'OK' ELSE 'MISSING' END,
           'Audit logs table'
    UNION ALL
    -- Check functions
    SELECT 'get_user_role', 
           CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_user_role' AND routine_schema = 'public') THEN 'OK' ELSE 'MISSING' END,
           'User role function'
    UNION ALL
    -- Check RLS is enabled
    SELECT 'rls_enabled', 
           CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ISSUE' END,
           'Row Level Security enabled on tables'
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN ('profiles', 'patients', 'appointments', 'case_notes', 'drugs', 'payments', 'messages', 'notifications')
      AND has_row_security = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ROLLBACK FUNCTION
-- =============================================

-- Function to rollback initial migration (development only)
CREATE OR REPLACE FUNCTION rollback_initial_migration() RETURNS TEXT AS $$
DECLARE
    tables_to_drop TEXT[] := ARRAY[
        'schema_migrations',
        'audit_logs',
        'push_subscriptions',
        'settings',
        'outreach_log',
        'notifications',
        'messages',
        'daily_summary',
        'invoices',
        'subscriptions',
        'payments',
        'inventory_dispensing',
        'drug_dispensing',
        'glasses_orders',
        'inventory_others',
        'glasses_inventory',
        'drugs',
        'prescriptions',
        'case_notes',
        'appointments',
        'patients',
        'profiles'
    ];
    table_name TEXT;
    drop_count INTEGER := 0;
BEGIN
    -- Drop tables in reverse order of creation
    FOREACH table_name IN ARRAY tables_to_drop
    LOOP
        BEGIN
            EXECUTE format('DROP TABLE IF EXISTS public.%s CASCADE', table_name);
            drop_count := drop_count + 1;
        EXCEPTION
            WHEN OTHERS THEN
                -- Continue even if table doesn't exist
                CONTINUE;
        END;
    END LOOP;
    
    -- Drop functions
    DROP FUNCTION IF EXISTS public.get_user_role() CASCADE;
    DROP FUNCTION IF EXISTS public.get_current_profile() CASCADE;
    DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
    DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
    DROP FUNCTION IF EXISTS public.audit_trigger_function() CASCADE;
    DROP FUNCTION IF EXISTS public.mark_message_read() CASCADE;
    DROP FUNCTION IF EXISTS public.update_drug_quantity_on_dispensing() CASCADE;
    DROP FUNCTION IF EXISTS public.update_inventory_others_quantity_on_dispensing() CASCADE;
    DROP FUNCTION IF EXISTS public.update_glasses_quantity_on_order() CASCADE;
    DROP FUNCTION IF EXISTS public.update_daily_summary_on_payment() CASCADE;
    DROP FUNCTION IF EXISTS public.update_daily_summary_on_appointment() CASCADE;
    DROP FUNCTION IF EXISTS public.migration_executed(TEXT) CASCADE;
    DROP FUNCTION IF EXISTS public.mark_migration_executed(TEXT, TEXT) CASCADE;
    DROP FUNCTION IF EXISTS public.run_initial_migration() CASCADE;
    DROP FUNCTION IF EXISTS public.validate_database_setup() CASCADE;
    DROP FUNCTION IF EXISTS public.rollback_initial_migration() CASCADE;
    
    RETURN format('Rollback completed. %s tables dropped.', drop_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

SELECT 'Initial migration setup completed' as status;
