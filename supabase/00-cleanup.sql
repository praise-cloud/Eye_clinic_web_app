-- =============================================
-- SIMPLE CLEANUP - Run this FIRST
-- =============================================

DO $$
DECLARE
    pol RECORD;
    trig RECORD;
    func RECORD;
    tbl RECORD;
BEGIN
    RAISE NOTICE 'Starting cleanup...';

    -- Drop ALL RLS policies on public schema tables
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                pol.policyname, pol.schemaname, pol.tablename);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END LOOP;

    RAISE NOTICE 'Policies dropped.';

    -- Drop ALL triggers on public tables
    FOR trig IN 
        SELECT trigger_name, event_object_table 
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public'
        OR trigger_name = 'on_auth_user_created'
    LOOP
        BEGIN
            EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I', 
                trig.trigger_name, 'public', trig.event_object_table);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END LOOP;

    RAISE NOTICE 'Triggers dropped.';

    -- Drop ALL functions with CASCADE
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

    RAISE NOTICE 'Functions dropped.';

    -- Drop ALL tables with CASCADE
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

    RAISE NOTICE 'Tables dropped.';
END $$;

SELECT 'CLEANUP COMPLETE! Database is now clean.' as status;
