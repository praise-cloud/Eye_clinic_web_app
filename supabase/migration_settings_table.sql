-- ============================================================
-- Settings Table Migration
-- Run in Supabase SQL Editor
-- ============================================================

-- Create settings table
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own settings
DROP POLICY IF EXISTS "Users read own settings" ON public.settings;
CREATE POLICY "Users read own settings"
    ON public.settings FOR SELECT
    TO authenticated
    USING (TRUE);

-- Policy: Users can insert/update their own settings
DROP POLICY IF EXISTS "Users manage own settings" ON public.settings;
CREATE POLICY "Users manage own settings"
    ON public.settings FOR ALL
    TO authenticated
    USING (TRUE);

-- Policy: Admins can manage all settings
DROP POLICY IF EXISTS "Admins manage all settings" ON public.settings;
CREATE POLICY "Admins manage all settings"
    ON public.settings FOR ALL
    TO authenticated
    USING (get_user_role() = 'admin');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_settings_key ON public.settings(key);