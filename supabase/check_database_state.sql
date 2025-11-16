-- ========================================
-- DIAGNOSTIC: Check Current Database State
-- Run this in Supabase SQL Editor to see what's ACTUALLY applied
-- ========================================

-- 1. Check if profiles table exists
SELECT
  schemaname,
  tablename,
  tableowner,
  rowsecurity AS "RLS Enabled"
FROM pg_tables
WHERE tablename = 'profiles';

-- 2. Check ALL policies on profiles table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd AS "Command",
  qual AS "USING clause",
  with_check AS "WITH CHECK clause"
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 3. Check grants/permissions
SELECT
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'profiles';

-- 4. Try to SELECT as anon user (this will fail if RLS blocks it)
-- This simulates what your app does when checking nicknames
SET ROLE anon;
SELECT COUNT(*) AS "Can anon SELECT?" FROM profiles;
RESET ROLE;

-- 5. Check if any profiles exist
SELECT COUNT(*) AS "Total profiles" FROM profiles;
