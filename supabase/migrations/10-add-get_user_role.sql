-- Add missing get_user_role function for RLS policies
CREATE OR REPLACE FUNCTION public.get_user_role() RETURNS text AS $$ BEGIN RETURN COALESCE(
    (
      SELECT role
      FROM public.profiles
      WHERE id = auth.uid()
      LIMIT 1
    ), 'frontdesk'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Grant execute to authenticated/public
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated,
  anon;
-- Verify
SELECT get_user_role();