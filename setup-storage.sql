-- Complete setup for Supabase Storage Civic Reports

-- 1. Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'civic-reports',
  'civic-reports',
  true,  -- Files are publicly accessible
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create storage policies
-- Allow authenticated users to upload files
CREATE POLICY IF NOT EXISTS "Authenticated users can upload"
  ON storage.objects FOR insert
  WITH CHECK (
    bucket_id = 'civic-reports'
    AND auth.role() = 'authenticated'
  );

-- Allow authenticated users to view public files
CREATE POLICY IF NOT EXISTS "Public read access"
  ON storage.objects FOR select
  USING (
    bucket_id = 'civic-reports'
    AND public = true
  );

-- Allow users to access their own files
CREATE POLICY IF NOT EXISTS "Users can access their own files"
  ON storage.objects FOR select
  USING (
    bucket_id = 'civic-reports'
    AND auth.uid()::text = (storage.foldername(name))[1:36]
  );

-- Allow users to update their own files
CREATE POLICY IF NOT EXISTS "Users can update their own files"
  ON storage.objects FOR update
  USING (
    bucket_id = 'civic-reports'
    AND auth.uid()::text = (storage.foldername(name))[1:36]
  );

-- Allow users to delete their own files
CREATE POLICY IF NOT EXISTS "Users can delete their own files"
  ON storage.objects FOR delete
  USING (
    bucket_id = 'civic-reports'
    AND auth.uid()::text = (storage.foldername(name))[1:36)
  );

-- 3. Update the incidents table policy to allow image_url
-- This ensures users can set image_url even if they're uploading to storage
ALTER POLICY IF EXISTS "Users can create incidents"
  ON incidents FOR insert
  WITH CHECK (
    auth.uid() = user_id
  );

-- 4. Function to validate and create signed URLs for private files (if needed)
CREATE OR REPLACE FUNCTION get_signed_upload_url(path TEXT, expires INT DEFAULT 3600)
RETURNS TEXT AS $$
DECLARE
  url TEXT;
BEGIN
  SELECT storage.sign(path, expires) INTO url;
  RETURN url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Test the setup
-- Run these queries after authenticating to test if everything works:

-- Test 1: Check if bucket exists
SELECT * FROM storage.buckets WHERE name = 'civic-reports';

-- Test 2: Check if policies exist
SELECT * FROM storage.policies WHERE bucket_id = 'civic-reports';

-- Test 3: Try to list files (should return empty if no files yet)
SELECT * FROM storage.objects WHERE bucket_id = 'civic-reports';