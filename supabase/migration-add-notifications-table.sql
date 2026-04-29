-- Migration: Add notifications table for persistent notifications
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('appointment', 'prescription', 'low_stock', 'payment', 'patient', 'dispensing', 'glasses', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users view own notifications'
  ) INTO _exists;
  IF NOT _exists THEN
    CREATE POLICY "Users view own notifications" ON public.notifications
      FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'System creates notifications'
  ) INTO _exists;
  IF NOT _exists THEN
    CREATE POLICY "System creates notifications" ON public.notifications
      FOR INSERT TO authenticated WITH CHECK (TRUE);
  END IF;
END $$;

DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users update own notifications'
  ) INTO _exists;
  IF NOT _exists THEN
    CREATE POLICY "Users update own notifications" ON public.notifications
      FOR UPDATE TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
DECLARE _exists bool;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users delete own notifications'
  ) INTO _exists;
  IF NOT _exists THEN
    CREATE POLICY "Users delete own notifications" ON public.notifications
      FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- Add table to realtime publication (for realtime notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
