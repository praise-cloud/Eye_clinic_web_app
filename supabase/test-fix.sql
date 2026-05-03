-- Test script to verify the database fix
-- Run this after applying the core schema

-- Test if the profiles table exists
SELECT 'Profiles table exists' as test,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') 
            THEN 'PASS' ELSE 'FAIL' END as result;

-- Test if the role column exists in profiles table
SELECT 'Role column exists' as test,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role' AND table_schema = 'public') 
            THEN 'PASS' ELSE 'FAIL' END as result;

-- Test if get_user_role function exists
SELECT 'get_user_role function exists' as test,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_user_role' AND routine_schema = 'public') 
            THEN 'PASS' ELSE 'FAIL' END as result;

-- Test if get_user_role function works (this will return NULL if no authenticated user)
SELECT 'get_user_role function works' as test,
       CASE WHEN get_user_role() IS NULL OR get_user_role() IN ('frontdesk', 'doctor', 'admin', 'manager') 
            THEN 'PASS' ELSE 'FAIL' END as result;
