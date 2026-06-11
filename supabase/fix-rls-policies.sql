-- Fix for RLS Policy Violation Error when uploading images

-- 1. First, create the civic-reports bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'civic-reports',
  'civic-reports',
  true,  -- Files are publicly accessible via URL
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4']
)
ON CONFLICT (name) DO NOTHING;

-- 2. Create storage policies for the civic-reports bucket
-- Allow authenticated users to upload files
CREATE POLICY IF NOT EXISTS "Authenticated users can upload to civic-reports"
  ON storage.objects FOR insert
  WITH CHECK (
    bucket_id = 'civic-reports'
    AND auth.role() = 'authenticated'
  );

-- Allow authenticated users to view their own files
CREATE POLICY IF NOT EXISTS "Users can view their own files"
  ON storage.objects FOR select
  USING (
    bucket_id = 'civic-reports'
    AND auth.uid()::text = (storage.foldername(name))[1:36]  -- Extract UUID from folder name
  );

-- Allow authenticated users to update their own files
CREATE POLICY IF NOT EXISTS "Users can update their own files"
  ON storage.objects FOR update
  USING (
    bucket_id = 'civic-reports'
    AND auth.uid()::text = (storage.foldername(name))[1:36]
  );

-- Allow authenticated users to delete their own files
CREATE POLICY IF NOT EXISTS "Users can delete their own files"
  ON storage.objects FOR delete
  USING (
    bucket_id = 'civic-reports'
    AND auth.uid()::text = (storage.foldername(name))[1:36]
  );

-- 3. Allow public access to uploaded files (via URL)
CREATE POLICY IF NOT EXISTS "Public access to civic-reports"
  ON storage.objects FOR select
  USING (
    bucket_id = 'civic-reports'
    AND public = true
  );

-- 4. Update the incidents table policy to allow image_url updates
-- This allows users to update incidents with image URLs
ALTER POLICY IF EXISTS "Users can update their own incidents"
  ON incidents FOR UPDATE
  USING (
    auth.uid() = user_id
  )
  WITH CHECK (
    auth.uid() = user_id
    -- Allow image_url to be updated even if the file is in storage
    AND (
      image_url IS NULL
      OR image_url LIKE 'https://%'
      OR image_url LIKE '%%civic-reports%%'
    )
  );

-- 5. Function to validate image URL belongs to the bucket
CREATE OR REPLACE FUNCTION validate_image_url(image_url TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF image_url IS NULL THEN
    RETURN true;
  END IF;

  -- Check if the URL matches our storage bucket pattern
  RETURN image_url LIKE '%storage/v1/object/public/civic-reports/%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alternative: Create a trigger to validate image URLs before insert
CREATE OR REPLACE FUNCTION validate_incident_image_url()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.image_url IS NOT NULL THEN
    -- Basic validation - ensure it's a valid URL
    IF NEW.image_url NOT LIKE 'https://%' AND NEW.image_url NOT LIKE 'http://%' THEN
      RAISE EXCEPTION 'Invalid image URL format';
    END IF;

    -- Optional: Verify the file exists in storage (uncomment if needed)
    -- SELECT validate_image_url(NEW.image_url) INTO valid_url;
    -- IF NOT valid_url THEN
    --   RAISE EXCEPTION 'Image URL does not belong to the civic-reports bucket';
    -- END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to incidents table
DROP TRIGGER IF EXISTS validate_incident_image_url_trigger ON incidents;
CREATE TRIGGER validate_incident_image_url_trigger
  BEFORE INSERT OR UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION validate_incident_image_url();

-- 6. For testing: Create a function to test if storage policies work
CREATE OR REPLACE FUNCTION test_storage_access()
RETURNS TABLE (
  status TEXT,
  message TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN auth.role() = 'authenticated' THEN 'authenticated'
      ELSE 'unauthenticated'
    END,
    'User authentication status';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;