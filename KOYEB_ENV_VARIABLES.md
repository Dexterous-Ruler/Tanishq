# Koyeb Environment Variables - Complete List

## 🔧 Required Environment Variables

Copy and paste these into Koyeb's environment variables section:

### Core Configuration
```
NODE_ENV=production
PORT=3000
```

### Database (Supabase)
```
DATABASE_URL=postgresql://postgres:TanishquSHA098%40@db.aftpyopmrdoojqejpkfv.supabase.co:5432/postgres
SUPABASE_URL=https://aftpyopmrdoojqejpkfv.supabase.co
SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SUPABASE_SERVICE_ROLE_KEY]
```

### Session & Security
```
SESSION_SECRET=[GENERATE_NEW_ONE_WITH: openssl rand -base64 32]
```

### Frontend URL (Auto-set by Koyeb)
```
FRONTEND_URL=https://{{ KOYEB_PUBLIC_DOMAIN }}
```
**Note:** Koyeb automatically replaces `{{ KOYEB_PUBLIC_DOMAIN }}` with your app's domain. You can also leave this empty and it will auto-detect.

---

## 🎯 Optional Environment Variables (For Full Functionality)

### Push Notifications (VAPID)
```
VAPID_PUBLIC_KEY=BNt8MFeuMkLWRfEOkzA3wyalyMN7LMoQxPXmdk7AWsceJ1NnctirRrhBXKeuPRuVNmRzXkOyWTujTMLJDTp0v00
VAPID_PRIVATE_KEY=uqfsvZXynKqjkXOE0uzS-8Xfkl-vs3uTNb4zHYmKV04
VAPID_SUBJECT=mailto:team@arogyavault.me
```

### AI Features
```
OPENAI_API_KEY=[YOUR_OPENAI_API_KEY]
```

### Google Places API
```
GOOGLE_PLACES_API_KEY=AIzaSyB87LYvV0gGmQHD8s4NJWiwgOSzl-h6de4
```

### Twilio SMS (OTP)
```
TWILIO_ACCOUNT_SID=[YOUR_TWILIO_ACCOUNT_SID]
TWILIO_AUTH_TOKEN=[YOUR_TWILIO_AUTH_TOKEN]
TWILIO_FROM_NUMBER=+17073480818
ENABLE_REAL_OTP=true
```

### Email (Resend)
```
EMAIL_PROVIDER=resend
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USERNAME=resend
SMTP_PASSWORD=[YOUR_RESEND_API_KEY]
```

### Cookie Settings
```
ALLOW_HTTP_COOKIES=false
```
**Note:** Set to `false` in production (Koyeb uses HTTPS)

---

## 📋 Quick Copy-Paste Template

### Minimum Required (App will work but limited features):
```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres:TanishquSHA098%40@db.aftpyopmrdoojqejpkfv.supabase.co:5432/postgres
SUPABASE_URL=https://aftpyopmrdoojqejpkfv.supabase.co
SUPABASE_ANON_KEY=[YOUR_KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_KEY]
SESSION_SECRET=[GENERATE_NEW_ONE]
FRONTEND_URL=https://{{ KOYEB_PUBLIC_DOMAIN }}
```

### Full Feature Set (Copy all from above sections)

---

## 🔐 How to Get Missing Values

### 1. Generate SESSION_SECRET
Run this command locally:
```bash
openssl rand -base64 32
```
Copy the output and use it as `SESSION_SECRET`.

### 2. Get Supabase Keys
1. Go to: https://supabase.com/dashboard/project/aftpyopmrdoojqejpkfv
2. Click **Settings** → **API**
3. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (secret!)

### 3. Get Resend API Key
1. Go to: https://resend.com/api-keys
2. Create or copy your API key
3. Use as `SMTP_PASSWORD`

### 4. Get Twilio Credentials
1. Go to: https://console.twilio.com
2. Copy:
   - **Account SID** → `TWILIO_ACCOUNT_SID`
   - **Auth Token** → `TWILIO_AUTH_TOKEN`
   - **Phone Number** → `TWILIO_FROM_NUMBER`

---

## ⚠️ Important Notes

1. **KOYEB_PUBLIC_DOMAIN**: This is automatically set by Koyeb. You can use `https://{{ KOYEB_PUBLIC_DOMAIN }}` or leave `FRONTEND_URL` empty - it will auto-detect.

2. **SESSION_SECRET**: Generate a NEW one for production (don't use the same as local dev).

3. **DATABASE_URL Password**: The `@` symbol is URL-encoded as `%40` in the connection string.

4. **Secrets**: Never commit these values to GitHub. Koyeb keeps them secure.

5. **After Deployment**: Once deployed, Koyeb will show your app URL. You can then update `FRONTEND_URL` with the actual domain if needed.

---

## ✅ Verification Checklist

After setting environment variables:

- [ ] `NODE_ENV=production`
- [ ] `PORT=3000`
- [ ] `DATABASE_URL` is correct (with `%40` for `@`)
- [ ] `SUPABASE_URL` is correct
- [ ] `SUPABASE_ANON_KEY` is set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set
- [ ] `SESSION_SECRET` is generated (new one)
- [ ] `FRONTEND_URL` uses `{{ KOYEB_PUBLIC_DOMAIN }}` or is empty
- [ ] Optional: VAPID keys for push notifications
- [ ] Optional: OpenAI key for AI features
- [ ] Optional: Twilio keys for SMS
- [ ] Optional: Resend key for email

---

## 🚀 After Setting Variables

1. Click **"Deploy"** in Koyeb
2. Wait for build (3-5 minutes)
3. Check logs for any errors
4. Visit your app URL
5. Test login and features

