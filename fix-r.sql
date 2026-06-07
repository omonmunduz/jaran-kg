-- Fix RLS policy for users table to allow signups
-- This policy allows authenticated users to create their own profile

CREATE POLICY "Authenticated users can insert their own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Also make phone nullable if it's causing issues
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;