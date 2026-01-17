# Supabase Setup Guide

Configuration guide for Supabase authentication with custom email templates.

## Overview

This project uses **custom email templates** sent via Resend instead of Supabase's default auth emails. The custom API endpoints handle:

- User signup with welcome/confirmation email
- Password reset emails
- Magic link (passwordless) login emails
- Team sharing invitations

## Disabling Default Auth Emails

Since we use custom emails, Supabase's default emails should be disabled to prevent duplicate emails.

### Step 1: Access Supabase Dashboard

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select the **goal-achiever-pro** project

### Step 2: Disable Automatic Confirmation Email

Go to **Authentication** → **Providers** → **Email**:

1. Toggle OFF **"Confirm email"**
   - Our `/api/auth/signup` endpoint handles confirmation via Supabase Admin API
   - This prevents Supabase from sending its default confirmation email

2. Keep **"Enable Email Provider"** ON
   - This is needed for email/password authentication to work

### Step 3: Configure Email Templates (Fallback)

Go to **Authentication** → **Email Templates**:

Even with confirmation disabled, keep minimal templates as fallback. Replace each template body with:

```html
<p>Please use the Goal Achiever Pro app to complete this action.</p>
<p>If you didn't request this, please ignore this email.</p>
```

Templates to update:
- **Confirm signup**
- **Invite user**
- **Magic Link**
- **Reset Password**
- **Change Email Address**

### Step 4: Configure URL Settings

Go to **Authentication** → **URL Configuration**:

**Site URL:**
```
https://goalachieverpro.com
```

**Redirect URLs** (add all):
```
https://goalachieverpro.com/callback
https://goalachieverpro.com/reset-password
https://goalachieverpro.com/accept-invite/**
http://localhost:3000/callback
http://localhost:3000/reset-password
http://localhost:3000/accept-invite/**
```

### Step 5: Configure Email Settings

Go to **Authentication** → **Email**:

| Setting | Recommended Value |
|---------|-------------------|
| Minimum delay between resend requests | 60 seconds |
| Double confirm email changes | ON |
| Enable email confirmations | OFF (we handle this) |

## Environment Variables

Ensure these are set in your `.env.local` and production environment:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Required for Admin API

# App URL (for email links)
NEXT_PUBLIC_APP_URL=https://goalachieverpro.com

# Resend (email sending)
RESEND_API_KEY=re_...
```

## How It Works

### Signup Flow
```
User fills signup form
        ↓
POST /api/auth/signup
        ↓
Supabase Admin API creates user + generates confirmation link
        ↓
Custom welcome email sent via Resend
        ↓
User clicks "Confirm Email" → /callback → logged in
```

### Password Reset Flow
```
User enters email on /forgot-password
        ↓
POST /api/auth/forgot-password
        ↓
Supabase Admin API generates recovery link
        ↓
Custom reset email sent via Resend
        ↓
User clicks "Reset Password" → /reset-password → sets new password
```

### Magic Link Flow
```
User enters email on /login (magic link mode)
        ↓
POST /api/auth/magic-link
        ↓
Supabase Admin API generates magic link
        ↓
Custom magic link email sent via Resend
        ↓
User clicks "Sign In" → /callback → logged in
```

## Troubleshooting

### Users receiving duplicate emails
- Ensure "Confirm email" is OFF in Authentication → Providers → Email
- Check that email templates are set to minimal fallback content

### Magic links not working
- Verify redirect URLs include `/callback`
- Check NEXT_PUBLIC_APP_URL is set correctly
- Ensure SUPABASE_SERVICE_ROLE_KEY is valid

### Emails not sending
- Verify RESEND_API_KEY is set
- Check Resend dashboard for delivery status
- Ensure sender domain is verified in Resend

### "Invalid token" errors
- Links expire: magic links (60min), reset password (24h)
- Links are single-use
- Check that Site URL matches your domain exactly

## API Endpoints Reference

| Endpoint | Purpose | Email Template |
|----------|---------|----------------|
| `POST /api/auth/signup` | Create account | Welcome |
| `POST /api/auth/forgot-password` | Reset password | Reset Password |
| `POST /api/auth/magic-link` | Passwordless login | Magic Link |
| `POST /api/sharing/invite` | Team invitation | Share Invitation |

## Security Notes

1. **Admin API Key**: The `SUPABASE_SERVICE_ROLE_KEY` is used server-side only to generate auth links. Never expose this to the client.

2. **Email Enumeration**: Auth endpoints return `{ success: true }` even for non-existent emails to prevent attackers from discovering valid accounts.

3. **Rate Limiting**: Consider adding rate limiting to auth endpoints to prevent abuse.

4. **Link Expiry**:
   - Magic links: 60 minutes
   - Password reset: 24 hours
   - Share invitations: 7 days
