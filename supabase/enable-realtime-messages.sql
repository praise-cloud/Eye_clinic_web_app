-- Enable Realtime for messages and notifications tables
-- Run EACH statement separately in Supabase SQL Editor

-- 1. Add messages table to Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 2. Add notifications table to Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 3. Verify tables are in the publication (run to check)
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('messages', 'notifications');

-- Note: If you get "already exists" errors, that's fine - it means the table is already added.
-- Just run step 3 to verify both tables appear in the results.
