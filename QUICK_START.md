# 🚀 Quick Start Guide - Ephemeral Canvas

Get up and running in **7 minutes**! 100% free, no credit card required.

## Step 1: Install Dependencies (2 minutes)

```bash
# Option A: Use installation script
./install.sh

# Option B: Manual installation
npm install
cp .env.local.example .env.local
```

## Step 2: Set Up Supabase (5 minutes)

### Create Project
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Choose:
   - Name: `ephemeral-canvas`
   - Password: (generate strong password)
   - Region: Closest to you

### Execute Database Schema
1. Click **"SQL Editor"** in sidebar
2. Click **"New Query"**
3. Open [docs/database-schema.sql](docs/database-schema.sql)
4. Copy ALL contents → Paste into SQL Editor
5. Click **"Run"** (Cmd/Ctrl + Enter)
6. Verify: Check **"Table Editor"** - you should see 9 tables

### Get Credentials
1. Go to **"Project Settings"** (⚙️ icon)
2. Navigate to **"API"** section
3. Copy these two values:
   ```
   Project URL: https://xxxxx.supabase.co
   anon public: eyJhbGc...
   ```

## Step 3: Configure Email Authentication (30 seconds)

**Email/password authentication is enabled by default in Supabase!**

Just verify it's turned on:
1. In Supabase Dashboard: **"Authentication"** → **"Providers"**
2. Find **"Email"** → Should already be **"Enabled"** ✅
3. (Optional) Configure email settings:
   - **Enable email confirmations**: Recommended for production
   - **For development**: You can disable confirmations for faster testing

**That's it!** No Google Cloud, no OAuth setup needed.

## Step 4: Configure Environment (.env.local)

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co  # From Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...            # From Supabase
NEXT_PUBLIC_ADMIN_EMAIL=your-email@gmail.com        # Your email
```

## Step 5: Run! 🎉

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## ✅ Verification Checklist

- [ ] `npm install` completed without errors
- [ ] Supabase project created
- [ ] Database schema executed (9 tables visible)
- [ ] Email authentication enabled (default in Supabase)
- [ ] `.env.local` updated with credentials
- [ ] Dev server running (`npm run dev`)
- [ ] Can access http://localhost:3000

## 🐛 Common Issues

### "Invalid API key"
→ Double-check `.env.local` has correct values from Supabase

### "Email not confirmed" error
→ In Supabase: Authentication → Settings → Disable "Enable email confirmations" for development

### "Database connection failed"
→ Ensure database-schema.sql executed successfully

### `npm install` fails
→ Verify Node.js 18+: `node --version`

---

## 📖 Next Steps

Once your dev server is running:

1. **Test Authentication**:
   - Click "Sign Up" or "Login"
   - Enter email and password
   - Create a nickname
   - You should see the canvas!

2. **Promote Yourself to Admin**:
   ```sql
   -- In Supabase SQL Editor
   UPDATE profiles
   SET is_admin = TRUE
   WHERE id = (
     SELECT id FROM auth.users
     WHERE email = 'your-email@gmail.com'
   );
   ```

3. **Start Development**:
   - See [docs/implementation-plan.md](docs/implementation-plan.md) for next phases
   - Phase 2: Core Canvas & Authentication is next!

---

## 🆘 Need Help?

- **Detailed Setup**: See [SETUP.md](SETUP.md)
- **Architecture**: See [docs/architecture.md](docs/architecture.md)
- **Implementation Plan**: See [docs/implementation-plan.md](docs/implementation-plan.md)

Happy coding! 🎨✨
