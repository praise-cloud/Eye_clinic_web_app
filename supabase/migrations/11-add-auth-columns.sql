-- Add authentication columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Update existing profiles to have email from auth.users (if needed)
UPDATE public.profiles 
SET email = (
  SELECT auth.users.email 
  FROM auth.users 
  WHERE auth.users.id = public.profiles.id
) 
WHERE email IS NULL;

-- Add index for email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

SELECT 'Authentication columns added to profiles table' as message;
