-- ========================================
-- Chat Attachments Migration
-- Run in Supabase SQL Editor
-- ========================================

-- 1. Add new columns to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS attachment_type TEXT CHECK (attachment_type IN ('image', 'document')),
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT;

-- 2. Create storage bucket for files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('files', 'files', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'])
ON CONFLICT (id) DO NOTHING;

-- 3. Add RLS policies for files bucket
DROP POLICY IF EXISTS "Anyone can view files" ON storage.objects;
CREATE POLICY "Anyone can view files"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'files' );

DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
CREATE POLICY "Authenticated users can upload files"
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'files' );

DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
CREATE POLICY "Users can update own files"
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'files' );

DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'files' );

-- 4. Add update/delete policies for messages
DROP POLICY IF EXISTS "Edit own messages" ON public.messages;
CREATE POLICY "Edit own messages"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid());

DROP POLICY IF EXISTS "Delete own messages" ON public.messages;
CREATE POLICY "Delete own messages"
  ON public.messages FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());