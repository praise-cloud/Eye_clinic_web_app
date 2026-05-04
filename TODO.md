# Eye Clinic Appointment 403 Fix - RESOLVED

✅ **Root cause:** Missing `get_user_role()` function used in ALL RLS policies

**Backend:** Running port 3001 ✓
**Code:** Correct (uses Supabase client)

## Fix Applied:
- Created supabase/migrations/10-add-get_user_role.sql
- Run in Supabase Dashboard SQL Editor OR:
  ```
  # If supabase CLI setup: supabase db push
  ```

**SQL:**
```sql
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
BEGIN
  RETURN COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1),
    'frontdesk'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated, anon;
```

## Test:
1. Run SQL above
2. Refresh app → Login now works
3. Book appointment → No 403 ✓

**Prevention:** Add missing functions before RLS policies.
