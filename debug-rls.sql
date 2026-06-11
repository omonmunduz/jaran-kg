-- Debug script for RLS issues

-- 1. Check if the civic-reports bucket exists
SELECT * FROM storage.buckets WHERE name = 'civic-reports';

-- 2. Check current storage policies for civic-reports
SELECT * FROM storage.policies WHERE bucket_id = 'civic-reports';

-- 3. Check if the incidents table has proper RLS policies
SELECT * FROM pg_policies
 WHERE tablename = 'incidents'
   AND policyname LIKE '%incident%';

-- 4. Check if there are any RLS policies on the users table
SELECT * FROM pg_policies
 WHERE tablename = 'users'
   AND policyname LIKE '%user%';

-- 5. Test if the current user can insert into incidents
-- Run this after authenticating
SELECT auth.uid();

-- 6. Check if the current authenticated user exists in the users table
SELECT * FROM users WHERE id = auth.uid();

-- 7. Test a simple insert (without image)
-- Run this after authenticating
INSERT INTO incidents (user_id, category, title, description, lat, lng)
VALUES (
  auth.uid(),
  '00000000-0000-0000-0000-000000000000',
  'Test without image',
  'Description',
  42.8746,
  74.5698
) RETURNING id;

-- 8. If the above works, try with an image_url
-- Note: The image_url should be a valid URL from the storage bucket
-- After uploading an image to civic-reports bucket, run:
-- INSERT INTO incidents (user_id, category, title, description, lat, lng, image_url)
-- VALUES (auth.uid(), '00000000-0000-0000-0000-000000000000', 'Test with image', 'Description', 42.8746, 74.5698, 'https://your-project.supabase.co/storage/v1/object/public/civic-reports/path/to/image.jpg')
-- RETURNING id;