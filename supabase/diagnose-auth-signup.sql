-- Diagnose why Supabase auth signup is failing with:
-- "Database error creating new user"
--
-- Run each query in the Supabase SQL Editor and inspect the results.

-- 1) What triggers exist on auth.users?
select
  t.tgname as trigger_name,
  n.nspname as schema_name,
  c.relname as table_name,
  p.proname as function_name
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
join pg_proc p on p.oid = t.tgfoid
where n.nspname = 'auth'
  and c.relname = 'users'
  and not t.tgisinternal;

-- 2) Show the actual function body used by the auth.users trigger.
select pg_get_functiondef(p.oid)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'handle_new_user';

-- 3) What does the profiles table actually look like?
select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
order by ordinal_position;

-- 4) What check constraints exist on profiles?
select
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.profiles'::regclass;

-- 5) Does profiles have RLS enabled?
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename = 'profiles';

-- 6) What policies exist on profiles?
select
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'profiles';
