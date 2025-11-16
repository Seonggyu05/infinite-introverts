-- ========================================
-- EPHEMERAL CANVAS - INITIAL SCHEMA
-- ========================================
-- Create the profiles table and core infrastructure

-- ========================================
-- EXTENSIONS
-- ========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- USER PROFILES TABLE
-- ========================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  position_x FLOAT8 NOT NULL DEFAULT 0,
  position_y FLOAT8 NOT NULL DEFAULT 0,
  is_admin BOOLEAN DEFAULT FALSE,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT nickname_length CHECK (char_length(nickname) <= 50),
  CONSTRAINT position_bounds CHECK (
    position_x BETWEEN -50000 AND 50000 AND
    position_y BETWEEN -50000 AND 50000
  ),
  CONSTRAINT unique_nickname UNIQUE (nickname)
);

-- ========================================
-- INDEXES
-- ========================================
CREATE INDEX idx_profiles_active ON profiles (last_active_at DESC);
CREATE INDEX idx_profiles_nickname ON profiles (nickname);

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow everyone to SELECT (check nicknames)
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only authenticated users can INSERT their own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Only authenticated users can UPDATE their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Only admins can DELETE profiles
CREATE POLICY "Admins can delete any profile"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ========================================
-- GRANTS
-- ========================================
GRANT SELECT ON profiles TO anon;
GRANT SELECT ON profiles TO authenticated;
GRANT INSERT, UPDATE ON profiles TO authenticated;
