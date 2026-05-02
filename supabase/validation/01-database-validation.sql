-- =============================================
-- EYE CLINIC DATABASE - VALIDATION SCRIPT
-- =============================================

-- This script validates that the database structure works correctly with the application
-- Run this after setting up the database to ensure everything is properly configured

-- =============================================
-- VALIDATION FUNCTIONS
-- =============================================

-- Function to validate all database components
CREATE OR REPLACE FUNCTION validate_database_integrity() RETURNS TABLE (
  component TEXT,
  status TEXT,
  details TEXT,
  severity TEXT
) AS $$
BEGIN
    -- Validate core tables
    RETURN QUERY
    SELECT 'Core Tables', 
           CASE WHEN COUNT(*) = 5 THEN 'PASS' ELSE 'FAIL' END,
           'Expected 5 core tables, found ' || COUNT(*),
           CASE WHEN COUNT(*) = 5 THEN 'info' ELSE 'error' END
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN ('profiles', 'patients', 'appointments', 'case_notes', 'prescriptions');
    
    -- Validate inventory tables
    RETURN QUERY
    SELECT 'Inventory Tables', 
           CASE WHEN COUNT(*) = 5 THEN 'PASS' ELSE 'FAIL' END,
           'Expected 5 inventory tables, found ' || COUNT(*),
           CASE WHEN COUNT(*) = 5 THEN 'info' ELSE 'error' END
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN ('drugs', 'glasses_inventory', 'inventory_others', 'drug_dispensing', 'glasses_orders');
    
    -- Validate payment tables
    RETURN QUERY
    SELECT 'Payment Tables', 
           CASE WHEN COUNT(*) = 4 THEN 'PASS' ELSE 'FAIL' END,
           'Expected 4 payment tables, found ' || COUNT(*),
           CASE WHEN COUNT(*) = 4 THEN 'info' ELSE 'error' END
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN ('payments', 'subscriptions', 'invoices', 'daily_summary');
    
    -- Validate communication tables
    RETURN QUERY
    SELECT 'Communication Tables', 
           CASE WHEN COUNT(*) = 6 THEN 'PASS' ELSE 'FAIL' END,
           'Expected 6 communication tables, found ' || COUNT(*),
           CASE WHEN COUNT(*) = 6 THEN 'info' ELSE 'error' END
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN ('messages', 'notifications', 'outreach_log', 'settings', 'push_subscriptions', 'audit_logs');
    
    -- Validate RLS is enabled
    RETURN QUERY
    SELECT 'RLS Enabled', 
           CASE WHEN COUNT(*) = 20 THEN 'PASS' ELSE 'FAIL' END,
           'Expected RLS on 20 tables, found ' || COUNT(*),
           CASE WHEN COUNT(*) = 20 THEN 'info' ELSE 'error' END
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN (
        'profiles', 'patients', 'appointments', 'case_notes', 'prescriptions',
        'drugs', 'glasses_inventory', 'inventory_others', 'drug_dispensing', 'glasses_orders',
        'payments', 'subscriptions', 'invoices', 'daily_summary',
        'messages', 'notifications', 'outreach_log', 'settings', 'push_subscriptions', 'audit_logs'
      )
      AND has_row_security = true;
    
    -- Validate key functions exist
    RETURN QUERY
    SELECT 'Core Functions', 
           CASE WHEN COUNT(*) >= 3 THEN 'PASS' ELSE 'FAIL' END,
           'Expected at least 3 core functions, found ' || COUNT(*),
           CASE WHEN COUNT(*) >= 3 THEN 'info' ELSE 'error' END
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
      AND routine_name IN ('get_user_role', 'get_current_profile', 'update_updated_at_column');
    
    -- Validate triggers
    RETURN QUERY
    SELECT 'Triggers', 
           CASE WHEN COUNT(*) >= 5 THEN 'PASS' ELSE 'FAIL' END,
           'Expected at least 5 triggers, found ' || COUNT(*),
           CASE WHEN COUNT(*) >= 5 THEN 'info' ELSE 'error' END
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public';
    
    -- Validate indexes
    RETURN QUERY
    SELECT 'Indexes', 
           CASE WHEN COUNT(*) >= 20 THEN 'PASS' ELSE 'FAIL' END,
           'Expected at least 20 indexes, found ' || COUNT(*),
           CASE WHEN COUNT(*) >= 20 THEN 'info' ELSE 'error' END
    FROM pg_indexes 
    WHERE schemaname = 'public';
    
    -- Validate foreign key constraints
    RETURN QUERY
    SELECT 'Foreign Keys', 
           CASE WHEN COUNT(*) >= 10 THEN 'PASS' ELSE 'FAIL' END,
           'Expected at least 10 foreign keys, found ' || COUNT(*),
           CASE WHEN COUNT(*) >= 10 THEN 'info' ELSE 'error' END
    FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
      AND constraint_type = 'FOREIGN KEY';
    
    -- Validate check constraints
    RETURN QUERY
    SELECT 'Check Constraints', 
           CASE WHEN COUNT(*) >= 15 THEN 'PASS' ELSE 'FAIL' END,
           'Expected at least 15 check constraints, found ' || COUNT(*),
           CASE WHEN COUNT(*) >= 15 THEN 'info' ELSE 'error' END
    FROM information_schema.check_constraints 
    WHERE constraint_schema = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate RLS policies
CREATE OR REPLACE FUNCTION validate_rls_policies() RETURNS TABLE (
  table_name TEXT,
  policy_count INTEGER,
  status TEXT,
  details TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name,
        COUNT(p.policyname) as policy_count,
        CASE WHEN COUNT(p.policyname) > 0 THEN 'PASS' ELSE 'FAIL' END,
        'Table has ' || COUNT(p.policyname) || ' policies'
    FROM information_schema.tables t
    LEFT JOIN pg_policies p ON p.tablename = t.table_name AND p.schemaname = t.table_schema
    WHERE t.table_schema = 'public' 
      AND t.table_name IN (
        'profiles', 'patients', 'appointments', 'case_notes', 'prescriptions',
        'drugs', 'glasses_inventory', 'inventory_others', 'drug_dispensing', 'glasses_orders',
        'payments', 'subscriptions', 'invoices', 'daily_summary',
        'messages', 'notifications', 'outreach_log', 'settings', 'push_subscriptions', 'audit_logs'
      )
    GROUP BY t.table_name
    ORDER BY t.table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate application-specific requirements
CREATE OR REPLACE FUNCTION validate_application_requirements() RETURNS TABLE (
  requirement TEXT,
  status TEXT,
  details TEXT,
  recommendation TEXT
) AS $$
BEGIN
    -- Check if profiles table has proper columns for application
    RETURN QUERY
    SELECT 'Profile Columns', 
           CASE WHEN COUNT(*) = 6 THEN 'PASS' ELSE 'FAIL' END,
           'Found ' || COUNT(*) || ' required columns',
           CASE WHEN COUNT(*) = 6 THEN 'None' ELSE 'Add missing columns' END
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles'
      AND column_name IN ('id', 'full_name', 'role', 'phone', 'avatar_url', 'is_active');
    
    -- Check if patients table has ophthalmology-specific fields
    RETURN QUERY
    SELECT 'Patient Columns', 
           CASE WHEN COUNT(*) >= 12 THEN 'PASS' ELSE 'FAIL' END,
           'Found ' || COUNT(*) || ' patient columns',
           CASE WHEN COUNT(*) >= 12 THEN 'None' ELSE 'Add missing patient columns' END
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'patients'
      AND column_name IN ('id', 'patient_number', 'first_name', 'last_name', 'date_of_birth', 'gender', 'phone', 'email', 'address', 'occupation', 'next_of_kin_name', 'next_of_kin_phone', 'allergies');
    
    -- Check if case notes has ophthalmology fields
    RETURN QUERY
    SELECT 'Case Notes Ophthalmology Fields', 
           CASE WHEN COUNT(*) >= 15 THEN 'PASS' ELSE 'FAIL' END,
           'Found ' || COUNT(*) || ' ophthalmology fields',
           CASE WHEN COUNT(*) >= 15 THEN 'None' ELSE 'Add missing ophthalmology fields' END
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'case_notes'
      AND column_name IN ('chief_complaint', 'diagnosis', 'treatment_plan', 'visiting_date', 'ophthalmoscopy_notes', 'unaided_dist_re', 'unaided_dist_le', 'aided_dist_re', 'aided_dist_le', 'final_rx_od', 'final_rx_os', 'lens_type', 'next_visiting_date', 'outstanding_bill');
    
    -- Check if appointments has proper status values
    RETURN QUERY
    SELECT 'Appointment Status Check', 
           'PASS', 
           'Status constraint exists',
           'None'
    FROM information_schema.check_constraints 
    WHERE constraint_schema = 'public' 
      AND constraint_name LIKE '%appointments%' 
      AND check_clause LIKE '%status%';
    
    -- Check if payments has proper payment types
    RETURN QUERY
    SELECT 'Payment Types Check', 
           'PASS', 
           'Payment type constraint exists',
           'None'
    FROM information_schema.check_constraints 
    WHERE constraint_schema = 'public' 
      AND constraint_name LIKE '%payments%' 
      AND check_clause LIKE '%payment_type%';
    
    -- Check if realtime is enabled for key tables
    RETURN QUERY
    SELECT 'Realtime Publication', 
           CASE WHEN COUNT(*) >= 3 THEN 'PASS' ELSE 'FAIL' END,
           'Found ' || COUNT(*) || ' tables in realtime publication',
           CASE WHEN COUNT(*) >= 3 THEN 'None' ELSE 'Add tables to realtime publication' END
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime';
    
    -- Check if audit logging is properly configured
    RETURN QUERY
    SELECT 'Audit Logging', 
           CASE WHEN EXISTS (
               SELECT 1 FROM information_schema.triggers 
               WHERE trigger_schema = 'public' 
               AND trigger_name LIKE '%audit%'
           ) THEN 'PASS' ELSE 'FAIL' END,
           'Audit triggers configured',
           CASE WHEN EXISTS (
               SELECT 1 FROM information_schema.triggers 
               WHERE trigger_schema = 'public' 
               AND trigger_name LIKE '%audit%'
           ) THEN 'None' ELSE 'Configure audit triggers' END;
    
    -- Check if user creation trigger exists
    RETURN QUERY
    SELECT 'User Creation Trigger', 
           CASE WHEN EXISTS (
               SELECT 1 FROM information_schema.triggers 
               WHERE trigger_schema = 'public' 
               AND trigger_name = 'on_auth_user_created'
           ) THEN 'PASS' ELSE 'FAIL' END,
           'Auth user creation trigger exists',
           CASE WHEN EXISTS (
               SELECT 1 FROM information_schema.triggers 
               WHERE trigger_schema = 'public' 
               AND trigger_name = 'on_auth_user_created'
           ) THEN 'None' ELSE 'Create user creation trigger' END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to run complete validation
CREATE OR REPLACE FUNCTION run_complete_validation() RETURNS TABLE (
  validation_type TEXT,
  total_checks INTEGER,
  passed_checks INTEGER,
  failed_checks INTEGER,
  status TEXT,
  summary TEXT
) AS $$
DECLARE
    integrity_results RECORD;
    rls_results RECORD;
    app_results RECORD;
    total_passed INTEGER := 0;
    total_failed INTEGER := 0;
    total_checks INTEGER := 0;
BEGIN
    -- Run integrity validation
    FOR integrity_results IN SELECT * FROM validate_database_integrity() LOOP
        total_checks := total_checks + 1;
        IF integrity_results.status = 'PASS' THEN
            total_passed := total_passed + 1;
        ELSE
            total_failed := total_failed + 1;
        END IF;
    END LOOP;
    
    -- Run RLS validation
    FOR rls_results IN SELECT * FROM validate_rls_policies() LOOP
        total_checks := total_checks + 1;
        IF rls_results.status = 'PASS' THEN
            total_passed := total_passed + 1;
        ELSE
            total_failed := total_failed + 1;
        END IF;
    END LOOP;
    
    -- Run application requirements validation
    FOR app_results IN SELECT * FROM validate_application_requirements() LOOP
        total_checks := total_checks + 1;
        IF app_results.status = 'PASS' THEN
            total_passed := total_passed + 1;
        ELSE
            total_failed := total_failed + 1;
        END IF;
    END LOOP;
    
    -- Return overall summary
    RETURN QUERY
    SELECT 'Complete Validation', total_checks, total_passed, total_failed,
           CASE WHEN total_failed = 0 THEN 'PASS' ELSE 'FAIL' END,
           format('Validation completed: %s/%s checks passed', total_passed, total_checks);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to test application queries
CREATE OR REPLACE FUNCTION test_application_queries() RETURNS TABLE (
  query_name TEXT,
  status TEXT,
  execution_time_ms NUMERIC,
  error_message TEXT
) AS $$
DECLARE
    start_time TIMESTAMPTZ;
    test_query TEXT;
    test_result RECORD;
BEGIN
    -- Test patient query
    start_time := NOW();
    test_query := 'SELECT COUNT(*) as count FROM public.patients';
    BEGIN
        EXECUTE test_query INTO test_result;
        RETURN QUERY
        SELECT 'Patient Count Query', 'PASS', 
               EXTRACT(MILLISECOND FROM (NOW() - start_time)), 
               NULL;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY
        SELECT 'Patient Count Query', 'FAIL', 
               EXTRACT(MILLISECOND FROM (NOW() - start_time)), 
               SQLERRM;
    END;
    
    -- Test appointment query
    start_time := NOW();
    test_query := 'SELECT COUNT(*) as count FROM public.appointments';
    BEGIN
        EXECUTE test_query INTO test_result;
        RETURN QUERY
        SELECT 'Appointment Count Query', 'PASS', 
               EXTRACT(MILLISECOND FROM (NOW() - start_time)), 
               NULL;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY
        SELECT 'Appointment Count Query', 'FAIL', 
               EXTRACT(MILLISECOND FROM (NOW() - start_time)), 
               SQLERRM;
    END;
    
    -- Test payment query
    start_time := NOW();
    test_query := 'SELECT COUNT(*) as count FROM public.payments';
    BEGIN
        EXECUTE test_query INTO test_result;
        RETURN QUERY
        SELECT 'Payment Count Query', 'PASS', 
               EXTRACT(MILLISECOND FROM (NOW() - start_time)), 
               NULL;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY
        SELECT 'Payment Count Query', 'FAIL', 
               EXTRACT(MILLISECOND FROM (NOW() - start_time)), 
               SQLERRM;
    END;
    
    -- Test inventory query
    start_time := NOW();
    test_query := 'SELECT COUNT(*) as count FROM public.drugs';
    BEGIN
        EXECUTE test_query INTO test_result;
        RETURN QUERY
        SELECT 'Drug Count Query', 'PASS', 
               EXTRACT(MILLISECOND FROM (NOW() - start_time)), 
               NULL;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY
        SELECT 'Drug Count Query', 'FAIL', 
               EXTRACT(MILLISECOND FROM (NOW() - start_time)), 
               SQLERRM;
    END;
    
    -- Test case notes query
    start_time := NOW();
    test_query := 'SELECT COUNT(*) as count FROM public.case_notes';
    BEGIN
        EXECUTE test_query INTO test_result;
        RETURN QUERY
        SELECT 'Case Notes Count Query', 'PASS', 
               EXTRACT(MILLISECOND FROM (NOW() - start_time)), 
               NULL;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY
        SELECT 'Case Notes Count Query', 'FAIL', 
               EXTRACT(MILLISECOND FROM (NOW() - start_time)), 
               SQLERRM;
    END;
    
    -- Test user role function
    start_time := NOW();
    test_query := 'SELECT get_user_role()';
    BEGIN
        EXECUTE test_query INTO test_result;
        RETURN QUERY
        SELECT 'User Role Function', 'PASS', 
               EXTRACT(MILLISECOND FROM (NOW() - start_time)), 
               NULL;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY
        SELECT 'User Role Function', 'FAIL', 
               EXTRACT(MILLISECOND FROM (NOW() - start_time)), 
               SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- VALIDATION REPORTS
-- =============================================

-- Create a comprehensive validation report
CREATE OR REPLACE FUNCTION generate_validation_report() RETURNS TABLE (
  section TEXT,
  item TEXT,
  status TEXT,
  details TEXT,
  recommendation TEXT
) AS $$
BEGIN
    -- Database integrity
    RETURN QUERY
    SELECT 'Database Integrity', component, status, details, 
           CASE WHEN status = 'PASS' THEN 'None' ELSE 'Fix reported issues' END
    FROM validate_database_integrity();
    
    -- RLS policies
    RETURN QUERY
    SELECT 'RLS Policies', table_name, status, details,
           CASE WHEN status = 'PASS' THEN 'None' ELSE 'Add missing policies' END
    FROM validate_rls_policies();
    
    -- Application requirements
    RETURN QUERY
    SELECT 'Application Requirements', requirement, status, details, recommendation
    FROM validate_application_requirements();
    
    -- Query performance
    RETURN QUERY
    SELECT 'Query Performance', query_name, status, 
           format('Execution time: %s ms', execution_time_ms) as details,
           CASE WHEN status = 'PASS' THEN 'None' ELSE 'Check query and indexes' END
    FROM test_application_queries();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

SELECT 'Database validation functions created successfully' as status;
