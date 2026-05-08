-- Enable Realtime for messages and notifications tables
-- Run this in Supabase SQL Editor

-- Add messages table to Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
-- If you get "already exists" error, that's fine - it means it's already added

-- Add notifications table to Realtime publication  
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
-- If you get "already exists" error, that's fine - it's already added

-- Verify tables are in the publication
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('messages', 'notifications');
