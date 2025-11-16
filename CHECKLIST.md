# Phase 1: Foundation Setup - Checklist

Track your progress through the initial setup phase.

## 🎯 Pre-Setup

- [ ] Node.js 18+ installed (`node --version`)
- [ ] Git installed (`git --version`)
- [ ] Supabase account created
- [ ] Google Cloud Console access

---

## 📦 Installation

- [ ] Run `./install.sh` OR `npm install`
- [ ] Dependencies installed successfully
- [ ] `.env.local` file created from example
- [ ] No errors in terminal

---

## 🗄️ Supabase Configuration

### Project Creation
- [ ] New Supabase project created
- [ ] Project name: `ephemeral-canvas`
- [ ] Strong database password set (saved securely)
- [ ] Region selected (closest to target audience)

### Database Schema
- [ ] Opened SQL Editor in Supabase
- [ ] Copied entire [docs/database-schema.sql](docs/database-schema.sql)
- [ ] Executed in SQL Editor (no errors)
- [ ] Verified 9 tables exist in Table Editor:
  - [ ] `profiles`
  - [ ] `thoughts`
  - [ ] `comments`
  - [ ] `comment_likes`
  - [ ] `open_chat`
  - [ ] `private_chats`
  - [ ] `private_messages`
  - [ ] `admin_actions`
  - [ ] `spam_reports`
  - [ ] `world_state`

### API Credentials
- [ ] Navigated to Project Settings → API
- [ ] Copied Project URL: `https://_____.supabase.co`
- [ ] Copied anon/public key: `eyJhbGc...`
- [ ] Pasted both into `.env.local`

---

## 🔐 Google OAuth Setup

### Google Cloud Console
- [ ] Created/selected project in Google Cloud Console
- [ ] Navigated to APIs & Services → Credentials
- [ ] Created OAuth client ID (Web application)
- [ ] Added JavaScript origins:
  - [ ] `http://localhost:3000`
- [ ] Added Redirect URIs:
  - [ ] `http://localhost:3000/auth/callback`
  - [ ] Supabase callback URL (from next section)
- [ ] Copied Client ID
- [ ] Copied Client Secret

### Supabase Auth Provider
- [ ] Opened Authentication → Providers in Supabase
- [ ] Enabled Google provider
- [ ] Pasted Google Client ID
- [ ] Pasted Google Client Secret
- [ ] Copied Supabase Callback URL
- [ ] Added Supabase Callback URL to Google Cloud redirect URIs
- [ ] Saved in Supabase

---

## 🔑 Environment Configuration

Edit `.env.local` with:
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your Supabase anon key
- [ ] `NEXT_PUBLIC_ADMIN_EMAIL` = Your email (for admin access)

---

## ✅ Verification

### Connection Test
- [ ] Run `npm run dev`
- [ ] No errors in terminal
- [ ] Server started on http://localhost:3000
- [ ] Can access localhost:3000 in browser

### Authentication Test
- [ ] Click "Login with Google" (once UI is built)
- [ ] Google OAuth popup appears
- [ ] Can authenticate successfully
- [ ] Redirected to nickname setup
- [ ] Can create nickname
- [ ] Profile created in Supabase profiles table

### Admin Setup
- [ ] Logged in at least once
- [ ] Run SQL to promote yourself to admin:
  ```sql
  UPDATE profiles
  SET is_admin = TRUE
  WHERE id = (
    SELECT id FROM auth.users
    WHERE email = 'your-email@gmail.com'
  );
  ```
- [ ] Verified `is_admin = true` in profiles table

---

## 🎉 Phase 1 Complete!

Once all items are checked:
- ✅ Foundation is ready
- ✅ Supabase configured
- ✅ Authentication working
- ✅ Admin access enabled

**Next**: Proceed to Phase 2 - Core Canvas & Authentication
See [docs/implementation-plan.md](docs/implementation-plan.md#phase-2-core-canvas--authentication-week-1-days-3-4)

---

## 📊 Progress Summary

**Completed**: _____ / 50 items

**Estimated Time**:
- Installation: ~2 minutes
- Supabase: ~5 minutes
- Google OAuth: ~3 minutes
- **Total: ~10 minutes**

**Actual Time Taken**: ______

---

## 🐛 Issues Encountered

Document any issues you encountered and how you resolved them:

1. Issue: _______________________________________________
   Solution: ____________________________________________

2. Issue: _______________________________________________
   Solution: ____________________________________________

3. Issue: _______________________________________________
   Solution: ____________________________________________

---

## 📝 Notes

Additional notes or observations:

___________________________________________________________
___________________________________________________________
___________________________________________________________

