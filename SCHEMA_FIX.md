# Database Schema Fix - L3 Comment Prevention

## Issue Encountered

**Error**: `ERROR: 0A000: cannot use subquery in check constraint`

**Location**: Line 87 in `docs/database-schema.sql`

**Cause**: PostgreSQL does not allow subqueries in CHECK constraints. The original schema attempted to prevent L3 comments using:

```sql
CONSTRAINT max_depth_l2 CHECK (
  parent_comment_id IS NULL OR
  NOT EXISTS (
    SELECT 1 FROM comments c2
    WHERE c2.id = parent_comment_id
    AND c2.parent_comment_id IS NOT NULL
  )
)
```

## Solution Applied

Replaced the CHECK constraint with a **TRIGGER-based approach**:

### 1. Updated Comments Table (Lines 73-85)

Removed the invalid CHECK constraint:

```sql
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
```

### 2. Added Trigger Function (Lines 467-494)

Created a BEFORE INSERT trigger that validates comment depth:

```sql
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
```

## How It Works

1. **L1 Comment** (top-level): `parent_comment_id IS NULL` → ✅ Allowed
2. **L2 Comment** (reply to L1): Parent has `parent_comment_id IS NULL` → ✅ Allowed
3. **L3 Comment** (reply to L2): Parent has `parent_comment_id IS NOT NULL` → ❌ **Rejected with error**

## Testing the Fix

After executing the corrected schema, test with:

```sql
-- Create test user and thought (assuming auth.uid() exists)
INSERT INTO thoughts (user_id, content, position_x, position_y)
VALUES (auth.uid(), 'Test thought', 0, 0);

-- L1 comment (should work)
INSERT INTO comments (user_id, thought_id, content)
VALUES (auth.uid(), (SELECT id FROM thoughts LIMIT 1), 'L1 comment');

-- L2 comment (should work)
INSERT INTO comments (user_id, thought_id, parent_comment_id, content)
VALUES (
  auth.uid(),
  (SELECT thought_id FROM comments LIMIT 1),
  (SELECT id FROM comments WHERE parent_comment_id IS NULL LIMIT 1),
  'L2 reply'
);

-- L3 comment (should FAIL)
INSERT INTO comments (user_id, thought_id, parent_comment_id, content)
VALUES (
  auth.uid(),
  (SELECT thought_id FROM comments LIMIT 1),
  (SELECT id FROM comments WHERE parent_comment_id IS NOT NULL LIMIT 1),
  'L3 reply - should fail'
);
-- Expected: ERROR: Cannot reply to L2 comments. Maximum comment depth is 2 levels.
```

## Next Steps

1. ✅ Fixed schema is ready in [docs/database-schema.sql](docs/database-schema.sql)
2. Re-run the complete SQL in Supabase SQL Editor
3. Verify all 9 tables are created successfully
4. Test comment depth enforcement
5. Continue with setup ([QUICK_START.md](QUICK_START.md))

## Status

✅ **FIXED** - Schema is now compatible with PostgreSQL constraints.

The corrected schema file is ready for execution!
