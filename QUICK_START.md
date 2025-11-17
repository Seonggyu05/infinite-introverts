# Quick Start Guide

## 🚀 Get the App Running in 10 Minutes

### Step 1: Install Dependencies (2 min)
```bash
npm install
```

### Step 2: Supabase Setup (5 min)

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Go to SQL Editor and run the complete schema from `docs/database-schema.sql`
4. **Important**: After running the schema, add the reset function:

```sql
CREATE OR REPLACE FUNCTION reset_world()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM comment_likes;
  DELETE FROM comments;
  DELETE FROM thoughts;
  DELETE FROM spam_reports;
  DELETE FROM private_messages;
  DELETE FROM private_chats;
  DELETE FROM open_chat;
  DELETE FROM admin_actions;
  DELETE FROM profiles;

  UPDATE world_state
  SET
    last_reset_at = NOW(),
    next_reset_at = (CURRENT_DATE + INTERVAL '1 day'),
    reset_count = reset_count + 1
  WHERE id = 1;
END;
$$;
```

5. Go to Authentication → Providers → Enable Google OAuth
6. Copy your project URL and anon key from Settings → API

### Step 3: Environment Setup (1 min)
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_ADMIN_EMAIL=your-email@gmail.com
```

### Step 4: Run Development Server (30 sec)
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Step 5: Make Yourself Admin (1 min)

After logging in for the first time:
1. Go to Supabase → Table Editor → profiles
2. Find your profile row
3. Set `is_admin = true`
4. Refresh the page

You now have access to the Admin Panel!

## ✅ Feature Checklist

Test these features:
- [x] Login with Google ✅
- [x] Set nickname ✅
- [x] Move your avatar by dragging ✅
- [x] Post a thought (top-right input) ✅
- [x] Click on a thought to view/comment ✅
- [x] Like/unlike comments ✅
- [x] Reply to comments (L1 and L2) ✅
- [x] Send message in Open Chat (bottom-left) ✅
- [x] Start private chat (click Chats button on left) ✅
- [x] See green connector lines between chatting users ✅
- [x] See countdown timer (top-left) ✅
- [x] Access Admin Panel if admin (top-right red button) ✅

## 🎨 What's Implemented

### Core Features
✅ **Infinite Canvas**: Pan, zoom, move your avatar  
✅ **Thought Bubbles**: Post thoughts with 300-word limit  
✅ **Comments**: L1 and L2 nested comments with likes  
✅ **Open Chat**: Global chat visible to everyone  
✅ **Private Chat**: 1-on-1 messaging with visual connectors  
✅ **Admin Tools**: Complete moderation panel  
✅ **Reset System**: 24-hour countdown with warnings  

### Real-time Features
- Avatar movement (throttled 100ms)
- Thought posting
- Comment updates
- Like counts
- Chat messages
- Presence tracking
- Position broadcasting

## 🐛 Troubleshooting

**"Failed to fetch" errors:**
- Check your Supabase URL and anon key
- Verify the project is not paused

**Can't log in:**
- Ensure Google OAuth is enabled in Supabase
- Check that your domain is allowed in OAuth settings

**Avatars not moving:**
- Check browser console for errors
- Verify RLS policies are set up correctly

## 📱 Mobile Support

The app works on mobile devices! Features:
- Touch-enabled canvas dragging
- Mobile-responsive UI
- Touch gestures for avatar movement

## 🚀 Next Steps

1. **Test everything** in development
2. **Setup production Supabase** with the same schema
3. **Deploy to Netlify** (see README.md for instructions)
4. **Configure automated reset** using Supabase Edge Functions or external cron

## 💡 Tips

- **Admin Panel**: Powerful moderation tools for content management
- **Keyboard Shortcuts**: Enter to post, Shift+Enter for new line
- **Canvas Navigation**: Mouse wheel to zoom, drag to pan, Home button to reset view
- **Private Chat**: Click Chats button (left side) to see active conversations
- **Thought Limits**: Maximum 10 thoughts per user (auto-deletes oldest)
- **Rate Limits**: 1 thought per 30 seconds to prevent spam

## 📊 Build Status

```
✓ All 7 phases completed
✓ Type check passing  
✓ Production build successful
✓ 20+ new components created
✓ Real-time features working
✓ Ready for deployment
```

Enjoy your ephemeral canvas! 🎨✨
