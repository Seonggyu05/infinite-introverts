-- Fix RLS policy for profiles to allow nickname checking
-- This allows both authenticated and unauthenticated users to check if nicknames exist

-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

-- Recreate with explicit permission for both authenticated and anon users
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO authenticated, anon
  USING (true);
