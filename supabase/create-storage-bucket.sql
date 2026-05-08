-- Storage bucket setup for chat attachments
-- IMPORTANT: Step 1 MUST be done via Supabase Dashboard (not SQL)

-- STEP 1: Create bucket via Supabase Dashboard
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "New Bucket"
-- 3. Name: files
-- 4. Check "Public bucket" (YES)
-- 5. Click "Create bucket"

-- STEP 2: Run these policy commands in SQL Editor (after creating bucket)
-- Run EACH statement separately:

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

-- STEP 3: Verify bucket exists (run in SQL Editor)
SELECT * FROM storage.buckets WHERE name = 'files';

-- STEP 4: Verify policies were created (run in SQL Editor)
SELECT * FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
