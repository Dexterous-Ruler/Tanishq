# 🚀 Render Deployment Guide - Arogya Vault

## ✅ Pre-Deployment Checklist

- [x] Supabase project created (`aftpyopmrdoojqejpkfv`)
- [x] Database tables created (14 tables)
- [x] Supabase URL configured
- [x] Supabase Anon Key configured
- [ ] Supabase Service Role Key obtained
- [ ] Session secret generated
- [ ] Code pushed to GitHub

---

## 🎯 Quick Deploy (5 Minutes)

### Step 1: Get Supabase Service Role Key

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/aftpyopmrdoojqejpkfv)
2. Click **Settings** → **API**
3. Copy the **`service_role`** key (secret key, shown once)
4. Save it - you'll need it in Step 3

### Step 2: Generate Session Secret

Run this command in your terminal:

```bash
openssl rand -base64 32
```

Copy the output - you'll need it in Step 3.

### Step 3: Deploy to Render

#### Option A: Using Render Blueprint (Recommended)

1. **Push to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Add Render deployment config"
   git push origin main
   ```

2. **Deploy via Render Dashboard**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click **"New +"** → **"Blueprint"**
   - Connect your GitHub repository: `PBL-TANISHQ`
   - Render will detect `render.yaml` automatically
   - Click **"Apply"**

3. **Add Secret Environment Variables**:
   - Go to your service → **"Environment"** tab
   - Add these variables:
     ```
     SUPABASE_SERVICE_ROLE_KEY=<paste-from-step-1>
     SESSION_SECRET=<paste-from-step-2>
     ```

4. **Optional - Add Email/SMS Keys**:
   - `SMTP_PASSWORD` - Your Resend API key
   - `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` - For push notifications
   - `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` - For SMS OTP

5. **Deploy**:
   - Click **"Manual Deploy"** → **"Deploy latest commit"**
   - Wait 5-10 minutes for build to complete

#### Option B: Manual Setup

1. **Go to Render Dashboard**:
   - Visit [dashboard.render.com](https://dashboard.render.com)
   - Sign up/login with GitHub

2. **Create New Web Service**:
   - Click **"New +"** → **"Web Service"**
   - Connect your GitHub repository: `PBL-TANISHQ`
   - Select the repository

3. **Configure Service**:
   - **Name**: `arogya-vault`
   - **Region**: Singapore (or closest to you)
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: **Free**

4. **Add Environment Variables**:
   
   Click **"Advanced"** → **"Add Environment Variable"** and add all variables from `.env.render` file:

   **Required:**
   ```
   NODE_ENV=production
   PORT=10000
   USE_DATABASE=true
   SUPABASE_URL=https://aftpyopmrdoojqejpkfv.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmdHB5b3BtcmRvb2pxZWpwa2Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2Mjc2NzQsImV4cCI6MjA4MzIwMzY3NH0.lPUgHqbcM74icbCQPwllZD5Kk749GW6z6DINsOwiZq8
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   SESSION_SECRET=<your-generated-secret>
   ```

   **Optional (for full functionality):**
   ```
   EMAIL_PROVIDER=smtp
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USERNAME=resend
   SMTP_PASSWORD=<your-resend-api-key>
   EMAIL_FROM=team@arogyavault.me
   EMAIL_FROM_NAME=Arogya Vault
   ```

5. **Deploy**:
   - Click **"Create Web Service"**
   - Wait 5-10 minutes for deployment

---

## 🎉 After Deployment

### Your App URL

Your app will be live at: `https://arogya-vault.onrender.com`

### Test Your Deployment

1. **Visit the URL** - Should load the authentication page
2. **Test Authentication**:
   - Enter a phone number
   - Click "Continue with OTP"
   - Check if OTP is sent (if SMS configured)
3. **Check Database Connection**:
   - Open browser console (F12)
   - Look for any database errors
4. **Test Document Upload** (after login):
   - Upload a test document
   - Verify it appears in the vault

### Monitor Logs

- Go to Render Dashboard → Your Service → **"Logs"** tab
- Watch for any errors during startup or runtime

---

## 🔧 Configuration Details

### Database Tables Created

All 14 tables are now in your Supabase project:

1. ✅ `users` - User profiles
2. ✅ `otp_sessions` - OTP verification
3. ✅ `sessions` - User sessions
4. ✅ `documents` - Medical documents
5. ✅ `document_versions` - Version history
6. ✅ `consents` - Sharing permissions
7. ✅ `consent_audit_logs` - Audit trail
8. ✅ `emergency_cards` - Emergency info
9. ✅ `nominees` - Emergency contacts
10. ✅ `medications` - Medication tracking
11. ✅ `medication_reminders` - Reminders
12. ✅ `push_subscriptions` - Push notifications
13. ✅ `chat_conversations` - AI chat sessions
14. ✅ `chat_messages` - Chat messages

### Supabase Storage (Optional)

To enable file uploads to Supabase Storage:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/aftpyopmrdoojqejpkfv)
2. Click **Storage** → **"Create bucket"**
3. Create buckets:
   - `documents` - For medical documents
   - `avatars` - For user profile pictures
4. Set bucket policies (public or private as needed)

---

## 🐛 Troubleshooting

### Build Fails

**Issue**: `npm install` or `npm run build` fails

**Fix**:
- Check Render logs for specific error
- Ensure `package.json` has all dependencies
- Try building locally: `npm run build`

### Database Connection Fails

**Issue**: "Failed to connect to database"

**Fix**:
- Verify `SUPABASE_URL` is correct
- Verify `SUPABASE_SERVICE_ROLE_KEY` is the **service_role** key (not anon key)
- Check Supabase project is active
- Go to Supabase Dashboard → Settings → API to verify keys

### App Spins Down After 15 Minutes

**Issue**: First request after inactivity takes 30-60 seconds

**Fix**: This is normal for Render's free tier. Options:
- Upgrade to paid plan ($7/month) for always-on
- Use a service like [UptimeRobot](https://uptimerobot.com) to ping your app every 5 minutes
- Accept the spin-down behavior for development/testing

### Session Issues

**Issue**: Users get logged out frequently

**Fix**:
- Ensure `SESSION_SECRET` is set and doesn't change between deployments
- Check session expiry settings in `server/config.ts`

### File Upload Fails

**Issue**: Document upload returns error

**Fix**:
- Verify Supabase Storage buckets are created
- Check bucket policies allow uploads
- Verify `SUPABASE_SERVICE_ROLE_KEY` has storage permissions

---

## 📊 Environment Variables Reference

| Variable | Required | Description | Where to Get |
|----------|----------|-------------|--------------|
| `NODE_ENV` | ✅ | Production mode | Set to `production` |
| `PORT` | ✅ | Server port | Set to `10000` (Render default) |
| `USE_DATABASE` | ✅ | Enable Supabase | Set to `true` |
| `SUPABASE_URL` | ✅ | Supabase project URL | Already configured |
| `SUPABASE_ANON_KEY` | ✅ | Public API key | Already configured |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Secret API key | Supabase Dashboard → Settings → API |
| `SESSION_SECRET` | ✅ | Session encryption | Generate with `openssl rand -base64 32` |
| `SMTP_PASSWORD` | ⚠️ | Email API key | [Resend Dashboard](https://resend.com) |
| `VAPID_PUBLIC_KEY` | ⚠️ | Push notification key | Generate with script |
| `VAPID_PRIVATE_KEY` | ⚠️ | Push notification key | Generate with script |
| `TWILIO_ACCOUNT_SID` | ⚠️ | SMS API key | [Twilio Console](https://console.twilio.com) |
| `TWILIO_AUTH_TOKEN` | ⚠️ | SMS API token | Twilio Console |
| `OPENAI_API_KEY` | ⚠️ | AI chatbot | [OpenAI Platform](https://platform.openai.com) |

---

## 🔐 Security Notes

### Service Role Key

⚠️ **IMPORTANT**: The `SUPABASE_SERVICE_ROLE_KEY` has **full database access**. Never expose it in:
- Client-side code
- Git commits
- Public documentation
- Browser console

It should ONLY be used in your backend (Render environment variables).

### Session Secret

- Generate a strong random secret
- Never commit it to Git
- Don't change it after deployment (users will be logged out)

---

## 🚀 Next Steps

1. **Set up Custom Domain** (optional):
   - Go to Render Dashboard → Your Service → **"Settings"**
   - Add custom domain
   - Update DNS records

2. **Enable SSL** (automatic):
   - Render provides free SSL certificates
   - HTTPS is enabled by default

3. **Set up Monitoring**:
   - Use Render's built-in monitoring
   - Set up alerts for downtime

4. **Configure Email/SMS**:
   - Sign up for [Resend](https://resend.com) for email
   - Sign up for [Twilio](https://twilio.com) for SMS
   - Add API keys to environment variables

5. **Enable Push Notifications**:
   - Generate VAPID keys: `npm run generate-vapid-keys`
   - Add keys to environment variables

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Project Documentation](./PROJECT_INDEX.md)
- [Free Deployment Guide](./FREE_DEPLOYMENT_GUIDE.md)

---

**Need Help?** Check Render logs or Supabase logs for detailed error messages.

**Deployment Date**: 2026-01-05
**Supabase Project**: `aftpyopmrdoojqejpkfv`
**Region**: ap-northeast-1 (Tokyo)
