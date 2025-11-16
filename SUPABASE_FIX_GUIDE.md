# Supabase 406 Error Fix Guide

## Problem Diagnosed

You were experiencing **HTTP 406 (Not Acceptable)** errors when trying to:
- Check nickname availability
- Create user profiles
- Query the profiles table

This is **NOT a hosting platform issue** (Vercel/Netlify). The problem is **Supabase client configuration**.

## Root Cause

The `@supabase/ssr` package needs explicit `Accept: application/json` headers to work properly with Supabase's REST API. Without these headers, Supabase returns 406 errors.

## Fixes Applied ✅

### 1. Updated Browser Client (`lib/supabase/client.ts`)
Added explicit JSON Accept header:
```typescript
{
  global: {
    headers: {
      'Accept': 'application/json',
    },
  },
}
```

### 2. Updated Server Client (`lib/supabase/server.ts`)
Added the same header configuration for server-side requests.

## Next Steps

### Step 1: Apply RLS Policies to Supabase

You still need to run the SQL in `apply_rls_fix_now.sql`:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: `qplnhfigssienyqfxnuz`
3. Navigate to: **SQL Editor** → **New Query**
4. Copy and paste the entire contents of `apply_rls_fix_now.sql`
5. Click **Run**

This will:
- Grant `SELECT` permission to anonymous users (for checking nicknames)
- Grant `INSERT` and `UPDATE` permissions to authenticated users
- Set up proper Row Level Security policies

### Step 2: Test Locally

```bash
npm run dev
```

1. Open http://localhost:3000
2. Sign in with Google
3. Try creating a nickname
4. **Expected behavior**: No more 406 errors in the browser console

### Step 3: Deploy to Netlify (or Vercel)

Both platforms work fine with this setup. Your README says Netlify, so:

**Netlify Deployment:**
```bash
# Build settings in Netlify dashboard:
Build command: npm run build
Publish directory: .next

# Environment Variables (add in Netlify dashboard):
NEXT_PUBLIC_SUPABASE_URL=https://qplnhfigssienyqfxnuz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
NEXT_PUBLIC_ADMIN_EMAIL=daniel.jeon5@gmail.com
```

## Platform Comparison

| Platform | Next.js Support | Supabase Compatible | Recommendation |
|----------|----------------|---------------------|----------------|
| **Vercel** | Excellent (creators of Next.js) | ✅ Yes | Best for Next.js |
| **Netlify** | Good | ✅ Yes | Works well, slightly different config |
| **Supabase** | Keep it! | ✅ Required | Just fix RLS, don't switch |

## Why Not Switch Platforms?

- ❌ **Switching from Supabase**: Would require rebuilding entire database, auth, and real-time systems
- ❌ **Switching from Vercel to Netlify**: Won't fix the issue (it's a client config problem)
- ✅ **Current fix**: Solves the problem with minimal changes

## Verification Checklist

After applying the fix:

- [ ] No 406 errors in browser console
- [ ] Nickname availability check works
- [ ] Profile creation succeeds
- [ ] User can access canvas page
- [ ] Real-time features work (once implemented)

## Still Having Issues?

Check browser console for:
1. **401 errors**: Authentication issue (check Google OAuth setup)
2. **403 errors**: Permission denied (RLS policies not applied)
3. **406 errors**: This fix didn't work (check Accept headers in Network tab)
4. **500 errors**: Server-side issue (check Supabase logs)

---

**Summary**: The fix has been applied to your codebase. Just run the SQL in Supabase, and you're good to go! 🚀
