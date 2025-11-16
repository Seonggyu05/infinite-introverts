# 🔐 Authentication Setup Guide

This project uses **Supabase Email/Password Authentication** - 100% free, no external services required.

## Overview

**Why Email/Password?**
- ✅ Zero cost (Supabase free tier: 50,000 users)
- ✅ No third-party OAuth setup (no Google Cloud, no API keys)
- ✅ Simple user experience
- ✅ No external dependencies
- ✅ Full control over user data

## Default Configuration

Email authentication is **enabled by default** in Supabase. No setup required!

## Optional Configuration

### For Development: Disable Email Confirmations

**Makes testing faster** - users can sign up instantly without checking email.

1. Supabase Dashboard → **"Authentication"** → **"Settings"**
2. Scroll to **"Email Auth"** section
3. Toggle **OFF**: "Enable email confirmations"
4. Click **"Save"**

**Now users can:**
- Sign up with any email (doesn't need to be real)
- Login immediately without confirmation

### For Production: Enable Email Confirmations

**Recommended for real users** - prevents fake accounts.

1. Supabase Dashboard → **"Authentication"** → **"Settings"**
2. Toggle **ON**: "Enable email confirmations"
3. Customize email templates (optional):
   - **"Email Templates"** section
   - Modify confirmation email design
   - Add your branding

**User flow:**
1. User signs up with email/password
2. Receives confirmation email
3. Clicks link to verify account
4. Can now login

## Email Configuration

### Default (Free)
Supabase sends emails from their domain:
- **From**: `noreply@mail.supabase.io`
- **Rate limit**: 30 emails/hour
- **Perfect for**: Development and small projects

### Custom Email (Optional)
For production, you can use your own email service:

**Supported Providers:**
- SendGrid
- AWS SES
- Postmark
- Mailgun
- Any SMTP server

**Setup:**
1. Supabase Dashboard → **"Authentication"** → **"Settings"**
2. Scroll to **"SMTP Settings"**
3. Enter your provider credentials
4. Test email sending

**Cost:** Most providers have free tiers:
- SendGrid: 100 emails/day free
- AWS SES: 62,000 emails/month free (on EC2)
- Mailgun: 5,000 emails/month free

## Password Requirements

**Default Supabase Settings:**
- Minimum length: 6 characters
- No complexity requirements

**Recommended for Production:**
1. Supabase Dashboard → **"Authentication"** → **"Settings"**
2. Update **"Password Strength"**:
   - Minimum length: 8 characters
   - Require uppercase, lowercase, numbers, symbols

## User Management

### View All Users
Supabase Dashboard → **"Authentication"** → **"Users"**

### Manually Create User
```sql
-- In Supabase SQL Editor
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES (
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  NOW()
);
```

### Delete User
1. Supabase Dashboard → **"Authentication"** → **"Users"**
2. Find user → Click **"..."** → **"Delete User"**

### Reset User Password
```sql
-- In Supabase SQL Editor
UPDATE auth.users
SET encrypted_password = crypt('newpassword', gen_salt('bf'))
WHERE email = 'user@example.com';
```

## Security Best Practices

### Rate Limiting (Built-in)
Supabase automatically rate limits:
- **Login attempts**: 5 per hour per IP
- **Password resets**: 2 per hour per email
- **Sign ups**: 10 per hour per IP

### Session Management
- **Default session length**: 1 week
- **Refresh tokens**: Valid for 60 days
- **Auto-refresh**: Handled by Supabase client

### Password Hashing
- **Algorithm**: bcrypt
- **Automatically handled** by Supabase
- **Never stored in plain text**

## Testing Authentication

### Test Sign Up Flow
1. Run dev server: `npm run dev`
2. Go to http://localhost:3000
3. Click "Sign Up"
4. Enter:
   - Email: `test@example.com`
   - Password: `password123`
5. Should redirect to nickname creation

### Test Login Flow
1. Click "Login"
2. Enter same credentials
3. Should redirect to canvas

### Test Admin Access
```sql
-- In Supabase SQL Editor
-- Make your test user an admin
UPDATE profiles
SET is_admin = TRUE
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = 'test@example.com'
);
```

## Troubleshooting

### "User not found" error
→ Check if user exists in Supabase Dashboard → Authentication → Users

### "Invalid login credentials"
→ Password is case-sensitive, check for typos

### "Email rate limit exceeded"
→ Wait 1 hour or disable confirmations in development

### User can't login after signup
→ If confirmations are enabled, check spam folder for confirmation email

### Session expires too quickly
→ Adjust session timeout in Supabase → Authentication → Settings

## Migration from OAuth

If you started with Google OAuth and want to switch:

1. **Keep existing users:**
   ```sql
   -- Users keep their accounts, just different login method
   -- No data loss
   ```

2. **Allow both methods:**
   - Enable both Email and Google providers
   - Users choose their preferred method
   - Same account if emails match

3. **Force email/password:**
   - Disable Google in Supabase → Authentication → Providers
   - Existing Google users must create password:
     - Use "Forgot Password" flow
     - Sets password for their Google email

## Cost Summary

| Component | Free Tier | Your Usage | Cost |
|-----------|-----------|------------|------|
| Supabase Auth | 50,000 MAU | Development | $0 |
| Database | 500 MB | Small DB | $0 |
| Email Delivery | 30/hour | Dev testing | $0 |
| **Total** | | | **$0/month** |

**When you might pay:**
- 50,000+ monthly active users → Supabase Pro ($25/month)
- Custom email domain → Email provider ($0-15/month)
- Advanced features → Optional add-ons

## Next Steps

1. ✅ Email auth is already configured
2. Test signup/login flow
3. Customize email templates (optional)
4. Enable confirmations before production
5. Set up custom domain email (optional)

**No Google Cloud. No OAuth complexity. Just simple authentication.** 🎉
