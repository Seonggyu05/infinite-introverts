# Ephemeral Canvas - Setup Guide

## Prerequisites
- Node.js 18+ installed
- Git installed
- Supabase account (free tier works)
- Google Cloud Console account (for OAuth)

---

## Step 1: Create Supabase Project

### 1.1 Create New Project
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in details:
   - **Name**: `ephemeral-canvas`
   - **Database Password**: (generate strong password, save it)
   - **Region**: Choose closest to your target audience
   - **Pricing Plan**: Free tier is sufficient for MVP

### 1.2 Execute Database Schema
1. Once project is created, go to **SQL Editor** in the left sidebar
2. Click "New Query"
3. Copy entire contents of `docs/database-schema.sql`
4. Paste into query editor
5. Click "Run" (or press Cmd/Ctrl + Enter)
6. Verify success: Check **Table Editor** - you should see 9 tables

### 1.3 Get Project Credentials
1. Go to **Project Settings** (gear icon)
2. Navigate to **API** section
3. Copy these values (you'll need them shortly):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...` (long JWT token)

---

## Step 2: Configure Google OAuth

### 2.1 Create Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project (or select existing)
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Choose **Web application**
6. Configure:
   - **Name**: `Ephemeral Canvas`
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (development)
     - `https://your-netlify-domain.netlify.app` (production - add later)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/auth/callback` (development)
     - `https://xxxxx.supabase.co/auth/v1/callback` (Supabase - see below)
     - `https://your-netlify-domain.netlify.app/auth/callback` (production - add later)
7. Click **Create**
8. Copy **Client ID** and **Client Secret**

### 2.2 Configure Supabase Auth
1. In Supabase Dashboard, go to **Authentication** > **Providers**
2. Find **Google** in the list
3. Toggle **Enable**
4. Paste your Google OAuth credentials:
   - **Client ID**: (from step 2.1)
   - **Client Secret**: (from step 2.1)
5. Copy the **Callback URL** shown (format: `https://xxxxx.supabase.co/auth/v1/callback`)
6. Go back to Google Cloud Console and add this URL to your OAuth redirect URIs
7. Click **Save** in Supabase

### 2.3 Create Admin User
1. In Supabase Dashboard, go to **SQL Editor**
2. Run this query (replace with your actual email):
   ```sql
   -- First, create a user via Google OAuth login (do this manually in the app once it's running)
   -- Then, promote that user to admin:
   UPDATE profiles
   SET is_admin = TRUE
   WHERE id = (
     SELECT id FROM auth.users WHERE email = 'your-admin-email@gmail.com'
   );
   ```
   Note: You'll run this AFTER your first login in the app.

---

## Step 3: Initialize Next.js Project

### 3.1 Create Next.js App
```bash
# Navigate to your project directory
cd "/Users/jeonseonggyu/Documents/Infinite Introverts"

# Create Next.js app
npx create-next-app@latest . --typescript --tailwind --app --import-alias "@/*"

# When prompted:
# ✔ Would you like to use TypeScript? Yes
# ✔ Would you like to use ESLint? Yes
# ✔ Would you like to use Tailwind CSS? Yes
# ✔ Would you like to use `src/` directory? No
# ✔ Would you like to use App Router? Yes
# ✔ Would you like to customize the default import alias? No
```

### 3.2 Install Dependencies
```bash
# Supabase
npm install @supabase/supabase-js @supabase/ssr @supabase/auth-helpers-nextjs

# State Management
npm install @tanstack/react-query zustand

# Canvas
npm install react-konva konva
npm install @types/react-konva --save-dev

# Utilities
npm install date-fns zod

# Development Tools
npm install --save-dev @types/node
```

### 3.3 Create Environment File
Create `.env.local` in project root:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Admin Configuration (replace with your admin email)
NEXT_PUBLIC_ADMIN_EMAIL=your-admin-email@gmail.com

# Optional: Analytics (add later if needed)
# NEXT_PUBLIC_SENTRY_DSN=
# NEXT_PUBLIC_ANALYTICS_ID=
```

**Important**: Add `.env.local` to `.gitignore` (should already be there by default)

---

## Step 4: Verify Setup

### 4.1 Check Project Structure
Your directory should look like this:
```
/Users/jeonseonggyu/Documents/Infinite Introverts/
├── .env.local              ✓ (just created)
├── .gitignore              ✓ (from Next.js)
├── package.json            ✓ (from Next.js)
├── tsconfig.json           ✓ (from Next.js)
├── tailwind.config.ts      ✓ (from Next.js)
├── next.config.js          ✓ (from Next.js)
├── app/                    ✓ (from Next.js)
├── public/                 ✓ (from Next.js)
└── docs/                   ✓ (our documentation)
```

### 4.2 Test Supabase Connection
Create a test file `test-supabase.ts` in project root:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function testConnection() {
  const { data, error } = await supabase.from('world_state').select('*')

  if (error) {
    console.error('❌ Connection failed:', error.message)
  } else {
    console.log('✅ Connection successful!')
    console.log('World state:', data)
  }
}

testConnection()
```

Run test:
```bash
npx ts-node test-supabase.ts
```

Expected output: `✅ Connection successful!`

Delete test file after verification:
```bash
rm test-supabase.ts
```

---

## Step 5: Next Steps

Once you've completed all steps above:

1. ✅ Supabase project created with schema
2. ✅ Google OAuth configured
3. ✅ Next.js project initialized
4. ✅ Dependencies installed
5. ✅ Environment variables set

**You're ready to proceed with implementation!**

The next phase will create:
- Supabase client utilities
- Authentication components
- Basic app layout
- Protected routes

---

## Troubleshooting

### Issue: "Invalid API key"
- **Solution**: Double-check your `.env.local` file has correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart dev server after changing env variables

### Issue: Google OAuth redirect fails
- **Solution**: Ensure all redirect URIs are correctly configured in both Google Cloud Console AND Supabase
- Check for trailing slashes (should NOT have them)

### Issue: Database schema execution fails
- **Solution**: Make sure you're using the SQL Editor in Supabase Dashboard, not a local PostgreSQL client
- Check for any existing tables with same names (drop them first if needed)

### Issue: `npm install` fails
- **Solution**: Make sure Node.js version is 18+: `node --version`
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and try again: `rm -rf node_modules package-lock.json && npm install`

---

## Security Checklist

Before going to production:

- [ ] `.env.local` is in `.gitignore` (never commit secrets!)
- [ ] Row Level Security (RLS) is enabled on all tables
- [ ] Admin email is set correctly in environment variables
- [ ] Google OAuth redirect URIs include production domain
- [ ] Supabase project has strong database password
- [ ] API keys are using `anon/public` key (not `service_role` key in frontend)

---

## Ready to Code?

Once setup is complete, proceed to implementation files being generated in the next step! 🎨
