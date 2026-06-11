-- Storage Policies for civic-reports bucket

-- Enable RLS on the storage bucket
ALTER POLICY IF EXISTS "Authenticated users can upload to civic-reports"
  ON storage.objects FOR insert
  WITH CHECK (
    bucket_id = 'civic-reports'
    AND auth.role() = 'authenticated'
  );

-- Allow authenticated users to view public files
CREATE POLICY IF NOT EXISTS "Public read access to civic-reports"
  ON storage.objects FOR select
  USING (
    bucket_id = 'civic-reports'
    AND (public = true OR auth.role() = 'authenticated')
  );

-- Allow users to access their own files
CREATE POLICY IF NOT EXISTS "Users can access their own files"
  ON storage.objects FOR select
  USING (
    bucket_id = 'civic-reports'
    AND auth.uid() = storage.foldername(name)::uuid
  );

-- Allow users to update their own files
CREATE POLICY IF NOT EXISTS "Users can update their own files"
  ON storage.objects FOR update
  USING (
    bucket_id = 'civic-reports'
    AND auth.uid() = storage.foldername(name)::uuid
  );

-- Allow users to delete their own files
CREATE POLICY IF NOT EXISTS "Users can delete their own files"
  ON storage.objects FOR delete
  USING (
    bucket_id = 'civic-reports'
    AND auth.uid() = storage.foldername(name)::uuid
  );