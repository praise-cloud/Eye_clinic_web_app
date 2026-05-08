-- Create storage bucket for chat attachments
-- NOTE: Run this in Supabase Dashboard → Storage → Create bucket
-- Name: files
-- Public bucket: YES (checked)

-- After creating the bucket via Dashboard, run these policy commands:

-- Policy 1: Authenticated users can upload to 'files' bucket
CREATE POLICY "files_upload_auth" ON storage.objects 
    FOR INSERT TO authenticated 
    WITH CHECK (bucket_id = 'files');

-- Policy 2: Authenticated users can view files in 'files' bucket
CREATE POLICY "files_select_auth" ON storage.objects 
    FOR SELECT TO authenticated 
    USING (bucket_id = 'files');

-- Policy 3: Users can update their own files
CREATE POLICY "files_update_own" ON storage.objects 
    FOR UPDATE TO authenticated 
    USING (auth.uid() = owner)
    WITH CHECK (auth.uid() = owner);

-- Policy 4: Users can delete their own files
CREATE POLICY "files_delete_own" ON storage.objects 
    FOR DELETE TO authenticated 
    USING (auth.uid() = owner);

-- Verify bucket exists
SELECT * FROM storage.buckets WHERE name = 'files';

-- Verify policies were created
SELECT * FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
