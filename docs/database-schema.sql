-- ========================================
-- EPHEMERAL CANVAS - DATABASE SCHEMA
-- ========================================
-- Supabase PostgreSQL Schema with RLS
-- 24-hour ephemeral lifecycle

-- ========================================
-- EXTENSIONS
-- ========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ========================================
-- ENUMS
-- ========================================
CREATE TYPE chat_status AS ENUM ('pending', 'accepted', 'declined');
CREATE TYPE admin_action_type AS ENUM ('delete_user', 'delete_thought', 'delete_comment', 'delete_chat_message', 'manual_reset', 'promote_admin');

-- ========================================
-- TABLES
-- ========================================

-- World State (singleton table for reset timing)
CREATE TABLE world_state (
  id INTEGER PRIMARY KEY DEFAULT 1,
  next_reset_at TIMESTAMPTZ NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 day'),
  last_reset_at TIMESTAMPTZ,
  reset_count INTEGER DEFAULT 0,
  CONSTRAINT singleton_world CHECK (id = 1)
);

-- Initial world state
INSERT INTO world_state (id, next_reset_at) VALUES (1, (CURRENT_DATE + INTERVAL '1 day'))
ON CONFLICT (id) DO NOTHING;

-- User Profiles
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

-- Thought Bubbles
CREATE TABLE thoughts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  position_x FLOAT8 NOT NULL,
  position_y FLOAT8 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_hidden BOOLEAN DEFAULT FALSE, -- Admin moderation flag

  -- Constraints
  CONSTRAINT content_length CHECK (char_length(content) <= 1800), -- ~300 words
  CONSTRAINT position_bounds CHECK (
    position_x BETWEEN -50000 AND 50000 AND
    position_y BETWEEN -50000 AND 50000
  )
);

-- Comments (L1 and L2)
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  thought_id UUID NOT NULL REFERENCES thoughts(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT content_length CHECK (char_length(content) <= 500)
  -- Note: L3 prevention enforced via trigger (see prevent_l3_comments function below)
);

-- Comment Likes
CREATE TABLE comment_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate likes
  CONSTRAINT unique_like UNIQUE (comment_id, user_id)
);

-- Open Chat (Global)
CREATE TABLE open_chat (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT message_length CHECK (char_length(message) <= 500)
);

-- Private Chats
CREATE TABLE private_chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status chat_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate chat pairs
  CONSTRAINT unique_chat_pair UNIQUE (user_1_id, user_2_id),
  CONSTRAINT different_users CHECK (user_1_id != user_2_id)
);

-- Private Messages
CREATE TABLE private_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES private_chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE,

  -- Constraints
  CONSTRAINT message_length CHECK (char_length(message) <= 500)
);

-- Admin Actions Audit Trail
CREATE TABLE admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type admin_action_type NOT NULL,
  target_id UUID, -- ID of deleted entity
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spam Reports (for community moderation)
CREATE TABLE spam_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  thought_id UUID REFERENCES thoughts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure either thought or comment is reported, not both
  CONSTRAINT report_target CHECK (
    (thought_id IS NOT NULL AND comment_id IS NULL) OR
    (thought_id IS NULL AND comment_id IS NOT NULL)
  )
);

-- ========================================
-- INDEXES
-- ========================================

-- Performance indexes
-- Note: Removed partial index predicate with NOW() as it's not IMMUTABLE
-- Instead, use this as a regular index for queries filtering by last_active_at
CREATE INDEX idx_profiles_active ON profiles (last_active_at DESC);

CREATE INDEX idx_profiles_nickname ON profiles (nickname);

CREATE INDEX idx_thoughts_user ON thoughts (user_id);
CREATE INDEX idx_thoughts_created ON thoughts (created_at DESC);
CREATE INDEX idx_thoughts_visible ON thoughts (is_hidden) WHERE is_hidden = FALSE;

-- Spatial index for viewport queries (requires PostGIS or custom implementation)
-- For now, use simple bounding box queries with standard B-tree indexes
CREATE INDEX idx_thoughts_position_x ON thoughts (position_x);
CREATE INDEX idx_thoughts_position_y ON thoughts (position_y);

CREATE INDEX idx_comments_thought ON comments (thought_id);
CREATE INDEX idx_comments_parent ON comments (parent_comment_id) WHERE parent_comment_id IS NOT NULL;

CREATE INDEX idx_comment_likes_comment ON comment_likes (comment_id);

CREATE INDEX idx_open_chat_created ON open_chat (created_at DESC);

CREATE INDEX idx_private_chats_users ON private_chats (user_1_id, user_2_id);
CREATE INDEX idx_private_chats_status ON private_chats (status);

CREATE INDEX idx_private_messages_chat ON private_messages (chat_id, created_at);
CREATE INDEX idx_private_messages_unread ON private_messages (chat_id) WHERE is_read = FALSE;

CREATE INDEX idx_admin_actions_admin ON admin_actions (admin_id, created_at DESC);

CREATE INDEX idx_spam_reports_thought ON spam_reports (thought_id);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE open_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE spam_reports ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all, insert their own, update only their own
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can delete any profile"
  ON profiles FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Thoughts: All can read non-hidden, users can insert/delete their own, admins can delete any
CREATE POLICY "Non-hidden thoughts are viewable by everyone"
  ON thoughts FOR SELECT
  USING (is_hidden = FALSE);

CREATE POLICY "Admins can view all thoughts"
  ON thoughts FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "Users can insert their own thoughts"
  ON thoughts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own thoughts"
  ON thoughts FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any thought"
  ON thoughts FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "Admins can update thought visibility"
  ON thoughts FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Comments: All can read, users can insert/delete their own
CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Users can insert comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any comment"
  ON comments FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Comment Likes: All can read, users can insert/delete their own
CREATE POLICY "Comment likes are viewable by everyone"
  ON comment_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like comments"
  ON comment_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike comments"
  ON comment_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Open Chat: All can read, users can insert, only admins can delete
CREATE POLICY "Open chat is viewable by everyone"
  ON open_chat FOR SELECT
  USING (true);

CREATE POLICY "Users can send open chat messages"
  ON open_chat FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can delete open chat messages"
  ON open_chat FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Private Chats: Users can view/manage their own chats
CREATE POLICY "Users can view their own private chats"
  ON private_chats FOR SELECT
  USING (auth.uid() IN (user_1_id, user_2_id));

CREATE POLICY "Users can create private chats"
  ON private_chats FOR INSERT
  WITH CHECK (auth.uid() = user_1_id);

CREATE POLICY "Users can update their own chat status"
  ON private_chats FOR UPDATE
  USING (auth.uid() IN (user_1_id, user_2_id));

-- Private Messages: Users can view messages in their chats
CREATE POLICY "Users can view messages in their chats"
  ON private_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM private_chats
      WHERE id = chat_id
      AND auth.uid() IN (user_1_id, user_2_id)
    )
  );

CREATE POLICY "Users can send messages in their chats"
  ON private_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM private_chats
      WHERE id = chat_id
      AND auth.uid() IN (user_1_id, user_2_id)
      AND status = 'accepted'
    )
  );

CREATE POLICY "Users can update read status in their chats"
  ON private_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM private_chats
      WHERE id = chat_id
      AND auth.uid() IN (user_1_id, user_2_id)
    )
  );

-- Admin Actions: Only admins can insert, all admins can view
CREATE POLICY "Admins can view admin actions"
  ON admin_actions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "Admins can log actions"
  ON admin_actions FOR INSERT
  WITH CHECK (
    auth.uid() = admin_id AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Spam Reports: Users can insert, admins can view all
CREATE POLICY "Users can report spam"
  ON spam_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can view spam reports"
  ON spam_reports FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ========================================
-- FUNCTIONS
-- ========================================

-- Update last_active_at timestamp
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET last_active_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updating last_active_at
CREATE TRIGGER update_last_active_thoughts
  AFTER INSERT ON thoughts
  FOR EACH ROW EXECUTE FUNCTION update_last_active();

CREATE TRIGGER update_last_active_comments
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION update_last_active();

CREATE TRIGGER update_last_active_open_chat
  AFTER INSERT ON open_chat
  FOR EACH ROW EXECUTE FUNCTION update_last_active();

CREATE TRIGGER update_last_active_private_messages
  AFTER INSERT ON private_messages
  FOR EACH ROW EXECUTE FUNCTION update_last_active();

-- Function to check thought count per user (spam prevention)
CREATE OR REPLACE FUNCTION check_thought_limit()
RETURNS TRIGGER AS $$
DECLARE
  thought_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO thought_count
  FROM thoughts
  WHERE user_id = NEW.user_id
  AND created_at > NOW() - INTERVAL '24 hours';

  IF thought_count >= 10 THEN
    -- Delete oldest thought
    DELETE FROM thoughts
    WHERE id = (
      SELECT id FROM thoughts
      WHERE user_id = NEW.user_id
      ORDER BY created_at ASC
      LIMIT 1
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_thought_limit
  BEFORE INSERT ON thoughts
  FOR EACH ROW EXECUTE FUNCTION check_thought_limit();

-- Function to auto-hide thoughts with 3+ spam reports
CREATE OR REPLACE FUNCTION auto_hide_spam()
RETURNS TRIGGER AS $$
DECLARE
  report_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO report_count
  FROM spam_reports
  WHERE thought_id = NEW.thought_id;

  IF report_count >= 3 THEN
    UPDATE thoughts
    SET is_hidden = TRUE
    WHERE id = NEW.thought_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_hide_spam_trigger
  AFTER INSERT ON spam_reports
  FOR EACH ROW EXECUTE FUNCTION auto_hide_spam();

-- Function to prevent L3 comments (max depth = 2)
CREATE OR REPLACE FUNCTION prevent_l3_comments()
RETURNS TRIGGER AS $$
DECLARE
  parent_depth INTEGER;
BEGIN
  -- If this is a top-level comment (L1), allow it
  IF NEW.parent_comment_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if parent comment has a parent (making it L2)
  SELECT parent_comment_id INTO parent_depth
  FROM comments
  WHERE id = NEW.parent_comment_id;

  -- If parent has a parent, this would be L3 - reject it
  IF parent_depth IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot reply to L2 comments. Maximum comment depth is 2 levels.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_comment_depth
  BEFORE INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION prevent_l3_comments();

-- Function for 24-hour world reset
CREATE OR REPLACE FUNCTION reset_world()
RETURNS void AS $$
BEGIN
  -- Truncate all user-generated data
  TRUNCATE TABLE private_messages CASCADE;
  TRUNCATE TABLE private_chats CASCADE;
  TRUNCATE TABLE open_chat CASCADE;
  TRUNCATE TABLE comment_likes CASCADE;
  TRUNCATE TABLE comments CASCADE;
  TRUNCATE TABLE thoughts CASCADE;
  TRUNCATE TABLE spam_reports CASCADE;
  TRUNCATE TABLE profiles CASCADE;
  TRUNCATE TABLE admin_actions CASCADE;

  -- Update world state
  UPDATE world_state
  SET
    last_reset_at = NOW(),
    next_reset_at = (CURRENT_DATE + INTERVAL '1 day'),
    reset_count = reset_count + 1
  WHERE id = 1;

  RAISE NOTICE 'World reset completed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Schedule daily reset at 00:00 UTC (requires pg_cron extension)
-- Run this via Supabase SQL Editor or Edge Function
-- SELECT cron.schedule(
--   'daily-world-reset',
--   '0 0 * * *', -- Every day at 00:00 UTC
--   $$ SELECT reset_world(); $$
-- );

-- ========================================
-- MATERIALIZED VIEWS (Optional Performance)
-- ========================================

-- Thought comment counts (refresh every 5 minutes)
CREATE MATERIALIZED VIEW thought_comment_counts AS
SELECT
  thought_id,
  COUNT(*) as comment_count
FROM comments
GROUP BY thought_id;

CREATE UNIQUE INDEX idx_thought_comment_counts ON thought_comment_counts (thought_id);

-- Refresh function (call periodically or via trigger)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY thought_comment_counts;
