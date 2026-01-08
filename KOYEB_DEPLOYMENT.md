# 🚀 Koyeb Deployment Guide - Arogya Vault

Complete guide to deploy your Arogya Vault app to Koyeb.

## 📋 Prerequisites

- ✅ GitHub account with code pushed
- ✅ Supabase project (database already hosted)
- ✅ Koyeb account (free tier available)

---

## 🎯 Step 1: Prepare Your Code

### 1.1 Push Code to GitHub

Your code is already prepared. The repository is configured to push to:
- **Repository:** `https://github.com/Dexterous-Ruler/Tanishq.git`

### 1.2 Verify Build Configuration

The app uses:
- **Build command:** `npm install && npm run build`
- **Start command:** `npm start`
- **Port:** `3000` (Koyeb will set `PORT` env var automatically)

---

## 🚀 Step 2: Create Koyeb Account

1. Go to **https://www.koyeb.com**
2. Click **"Sign Up"** or **"Get Started"**
3. Sign up with GitHub (recommended) or email
4. Verify your email if needed

---

## 🎯 Step 3: Deploy to Koyeb

### Option A: Deploy via Koyeb Dashboard (Recommended)

1. **Go to Koyeb Dashboard:**
   - Visit https://app.koyeb.com
   - Click **"Create App"** or **"New App"**

2. **Connect GitHub Repository:**
   - Select **"GitHub"** as source
   - Authorize Koyeb to access your GitHub
   - Select repository: **`Dexterous-Ruler/Tanishq`**
   - Select branch: **`main`**

3. **Configure Build Settings:**
   - **Build command:** `npm install && npm run build`
   - **Run command:** `npm start`
   - **Port:** `3000` (or leave empty, Koyeb will auto-detect)

4. **Add Environment Variables:**
   Click **"Environment Variables"** and add:

   **Required:**
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.aftpyopmrdoojqejpkfv.supabase.co:5432/postgres
   SESSION_SECRET=[generate with: openssl rand -base64 32]
   SUPABASE_URL=https://aftpyopmrdoojqejpkfv.supabase.co
   SUPABASE_ANON_KEY=[your-anon-key]
   SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
   ```

   **Optional (for full functionality):**
   ```
   VAPID_PUBLIC_KEY=[your-vapid-public-key]
   VAPID_PRIVATE_KEY=[your-vapid-private-key]
   VAPID_SUBJECT=mailto:team@arogyavault.me
   OPENAI_API_KEY=[your-openai-key]
   GOOGLE_PLACES_API_KEY=[your-google-places-key]
   TWILIO_ACCOUNT_SID=[your-twilio-sid]
   TWILIO_AUTH_TOKEN=[your-twilio-token]
   TWILIO_FROM_NUMBER=[your-twilio-number]
   ENABLE_REAL_OTP=true
   EMAIL_PROVIDER=resend
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USERNAME=resend
   SMTP_PASSWORD=[your-resend-api-key]
   FRONTEND_URL=[will-be-auto-set-by-koyeb]
   ```

5. **Deploy:**
   - Click **"Deploy"**
   - Wait for build to complete (3-5 minutes)
   - Your app will be live at: `https://your-app-name.koyeb.app`

### Option B: Deploy via Koyeb CLI

1. **Install Koyeb CLI:**
   ```bash
   # macOS/Linux
   curl -fsSL https://www.koyeb.com/cli.sh | sh
   
   # Or via npm
   npm install -g @koyeb/cli
   ```

2. **Login:**
   ```bash
   koyeb auth login
   ```

3. **Create App:**
   ```bash
   koyeb app create arogya-vault
   ```

4. **Create Service:**
   ```bash
   koyeb service create arogya-vault \
     --app arogya-vault \
     --git github.com/Dexterous-Ruler/Tanishq \
     --git-branch main \
     --build-command "npm install && npm run build" \
     --run-command "npm start" \
     --ports 3000:http
   ```

5. **Set Environment Variables:**
   ```bash
   koyeb secret create \
     --name arogya-vault-secrets \
     NODE_ENV=production \
     DATABASE_URL=postgresql://... \
     SESSION_SECRET=... \
     # ... add all other secrets
   ```

---

## 🔧 Step 4: Configure Custom Domain (Optional)

1. **In Koyeb Dashboard:**
   - Go to your app → **"Domains"**
   - Click **"Add Domain"**
   - Enter your domain (e.g., `arogyavault.com`)
   - Follow DNS configuration instructions

2. **Update Environment Variable:**
   - Set `FRONTEND_URL=https://your-domain.com` in environment variables

---

## ✅ Step 5: Verify Deployment

1. **Check App Status:**
   - Go to Koyeb dashboard
   - Your app should show **"Running"** status

2. **Test Your App:**
   - Visit your app URL: `https://your-app-name.koyeb.app`
   - Test login, document upload, etc.

3. **Check Logs:**
   - In Koyeb dashboard → **"Logs"** tab
   - Verify no errors during startup

---

## 🔍 Troubleshooting

### Build Fails

- **Check build logs** in Koyeb dashboard
- **Verify Node.js version** (Koyeb uses latest LTS by default)
- **Check package.json** scripts are correct

### App Crashes on Start

- **Check runtime logs** in Koyeb dashboard
- **Verify environment variables** are set correctly
- **Verify DATABASE_URL** is correct and accessible
- **Check PORT** is set to 3000 or matches Koyeb's assigned port

### Database Connection Issues

- **Verify DATABASE_URL** format is correct
- **Check Supabase** allows connections from Koyeb IPs
- **Verify credentials** are correct

### Static Files Not Loading

- **Verify build output** includes `dist/public` directory
- **Check service worker** is accessible at `/sw.js`
- **Verify manifest.json** is accessible

---

## 📊 Koyeb Features

- ✅ **Free Tier Available** - Great for testing
- ✅ **Automatic HTTPS** - SSL certificates included
- ✅ **Auto-scaling** - Handles traffic spikes
- ✅ **Git Integration** - Auto-deploy on push
- ✅ **Environment Variables** - Secure secret management
- ✅ **Custom Domains** - Use your own domain
- ✅ **Logs & Monitoring** - Built-in observability

---

## 🔄 Continuous Deployment

Koyeb automatically deploys when you push to your GitHub repository:

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Update app"
   git push origin main
   ```

2. **Koyeb Auto-Deploys:**
   - Koyeb detects the push
   - Builds your app
   - Deploys new version
   - Zero-downtime deployment

---

## 📝 Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `SESSION_SECRET` | Session encryption key | `[random-32-char-string]` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `[key]` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `[key]` |

### Optional Variables

| Variable | Description |
|----------|-------------|
| `VAPID_PUBLIC_KEY` | Push notification public key |
| `VAPID_PRIVATE_KEY` | Push notification private key |
| `OPENAI_API_KEY` | OpenAI API key for AI features |
| `GOOGLE_PLACES_API_KEY` | Google Places API key |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_FROM_NUMBER` | Twilio phone number |
| `SMTP_PASSWORD` | Email service API key |
| `FRONTEND_URL` | Your app's public URL |

---

## 🎉 Success!

Your app is now deployed on Koyeb! 

**Next Steps:**
1. Test all features
2. Set up custom domain (optional)
3. Monitor logs for any issues
4. Enjoy your deployed app! 🚀

