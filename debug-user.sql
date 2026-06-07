-- Debug script to check user existence and create if needed
-- Run this in the Supabase SQL Editor

-- Check current users in the table
SELECT id, username, created_at FROM users ORDER BY created_at DESC;

-- Check if the current auth user exists in the users table
-- Replace 'your-user-id' with the actual user ID from the error
-- SELECT * FROM users WHERE id = 'your-user-id';

-- Example of how to create a user manually
-- INSERT INTO users (id, username, created_at)
-- VALUES ('your-user-id', 'testuser', NOW())
-- ON CONFLICT (id) DO NOTHING;