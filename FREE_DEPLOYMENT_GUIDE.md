# 🚀 Free Deployment Guide - Arogya Vault

This guide covers the **best free deployment options** for your full-stack application.

## ⚡ Quick Start (TL;DR)

**Recommended:** Use **Railway** (stays active, $5/month free credit) or **Fly.io** (stays active, free tier)

**Important:** Your database is **Supabase** (already hosted), so you only need to deploy your Express server!

**⚠️ Note:** Render free tier spins down after 15 min inactivity. For always-on, use Railway or Fly.io!

1. Push code to GitHub
2. Deploy Express server (serves frontend + backend API together)
3. Add Supabase environment variables
4. Done! 🎉

**Your app serves frontend and backend together, so you only need ONE deployment!**

## 🏗️ Your Architecture

**Your app uses:**
- **Frontend:** React (served by Express)
- **Backend API:** Express.js server
- **Database & Storage:** Supabase (already hosted - no deployment needed!)

**What you need to deploy:**
- ✅ Express server (serves both frontend and API)
- ❌ Database (Supabase handles this)
- ❌ File storage (Supabase Storage handles this)

## 📊 Quick Comparison

| Platform | Frontend | Backend | Always Active? | Database | Best For |
|----------|----------|---------|----------------|----------|----------|
| **Railway** | ✅ Free | ✅ Free | ✅ Yes | ✅ Supabase | **⭐ BEST - Stays active, $5/month credit** |
| **Fly.io** | ✅ Free | ✅ Free | ✅ Yes | ✅ Supabase | **⭐ BEST - Stays active, free tier** |
| **Render** | ✅ Free | ✅ Free | ❌ Spins down after 15min | ✅ Supabase | Easy but spins down |
| **Vercel** | ✅ Free | ⚠️ Serverless | ✅ Yes | ✅ Supabase | Requires refactoring |
| **Cloudflare Pages** | ✅ Free | ⚠️ Workers | ✅ Yes | ✅ Supabase | Already configured |

---

## 🎯 Option 1: Railway (RECOMMENDED - Stays Active!)

**Why Railway?** 
- ✅ **Stays active 24/7** (no spin-down)
- ✅ $5/month free credit (usually enough for small apps)
- ✅ Easy setup, great developer experience
- ✅ Automatic HTTPS

**Note:** Your database is **Supabase** (already hosted), so you only need to deploy your Express server!

### Step 1: Deploy on Railway

1. **Go to Railway:**
   - Visit https://railway.app
   - Sign up with GitHub (free)

2. **Create New Project:**
   - Click **"New Project"**
   - Select **"Deploy from GitHub repo"**
   - Choose your repository: `PBL-TANISHQ`

3. **Configure Service:**
   - Railway auto-detects your Node.js app
   - Go to your service → **"Settings"** → **"Deploy"**
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Root Directory:** Leave empty

4. **Add Environment Variables:**
   - Go to your service → **"Variables"** tab
   - Click **"+ New Variable"** and add:
   ```
   NODE_ENV=production
   PORT=3000
   SESSION_SECRET=<generate-with-openssl-rand-base64-32>
   USE_DATABASE=true
   SUPABASE_URL=<your-supabase-project-url>
   SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
   SUPABASE_ANON_KEY=<your-supabase-anon-key>
   EMAIL_PROVIDER=smtp
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USERNAME=resend
   SMTP_PASSWORD=<your-resend-api-key>
   EMAIL_FROM=team@arogyavault.me
   EMAIL_FROM_NAME=Arogya Vault
   VAPID_PUBLIC_KEY=<your-vapid-public-key>
   VAPID_PRIVATE_KEY=<your-vapid-private-key>
   VAPID_SUBJECT=mailto:team@arogyavault.me
   ```

   **Where to find Supabase keys:**
   - Go to your Supabase project: https://supabase.com/dashboard
   - Click **Settings** → **API**
   - Copy:
     - **Project URL** → `SUPABASE_URL`
     - **service_role key** (secret) → `SUPABASE_SERVICE_ROLE_KEY`
     - **anon public key** → `SUPABASE_ANON_KEY`

5. **Generate Public URL:**
   - Go to your service → **"Settings"** → **"Networking"**
   - Click **"Generate Domain"**
   - You'll get: `https://arogya-vault-production.up.railway.app`

**✅ Done!** Your app is live on Railway and stays active 24/7!

---

## 🎯 Option 2: Fly.io (RECOMMENDED - Free & Always Active!)

**Why Fly.io?**
- ✅ **Stays active 24/7** (no spin-down)
- ✅ Free tier with 3 shared VMs
- ✅ Great for containers
- ✅ Automatic HTTPS

**Note:** Your database is **Supabase** (already hosted), so you only need to deploy your Express server!

### Step 1: Install Fly CLI

```bash
# macOS
curl -L https://fly.io/install.sh | sh

# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex

# Linux
curl -L https://fly.io/install.sh | sh
```

### Step 2: Create fly.toml

Create `fly.toml` in your project root:

```toml
app = "arogya-vault"
primary_region = "iad"

[build]
  builder = "paketobuildpacks/builder:base"

[env]
  NODE_ENV = "production"
  PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]

[[vm]]
  memory_mb = 256
  cpu_kind = "shared"
  cpus = 1
```

### Step 3: Deploy

```bash
# Login
fly auth login

# Launch app (first time)
fly launch

# Set secrets
fly secrets set SESSION_SECRET="$(openssl rand -base64 32)"
fly secrets set USE_DATABASE="true"
fly secrets set SUPABASE_URL="your-supabase-url"
fly secrets set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
fly secrets set SUPABASE_ANON_KEY="your-anon-key"
# ... add other secrets

# Deploy
fly deploy
```

**✅ Done!** Your app is live at: `https://arogya-vault.fly.dev` and stays active!

---

## 🎯 Option 3: Render (Spins Down After 15min)

**Why Render?** Free tier, easy setup, automatic HTTPS, and great for full-stack apps.

**Note:** Your database is **Supabase** (already hosted), so you only need to deploy your Express server!

### Step 1: Prepare Your Repository

1. **Push your code to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

### Step 2: Deploy Your Express Server (Frontend + Backend Together)

1. **Go to Render Dashboard:**
   - Visit https://dashboard.render.com
   - Sign up/login (free with GitHub)

2. **Create New Web Service:**
   - Click **"New +"** → **"Web Service"**
   - Connect your GitHub repository: `PBL-TANISHQ`
   - Select the repository

3. **Configure Service:**
   - **Name:** `arogya-vault` (or any name)
   - **Region:** Choose closest to you
   - **Branch:** `main`
   - **Root Directory:** Leave empty
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** **Free**

4. **Add Environment Variables:**
   Click **"Advanced"** → **"Add Environment Variable"** and add:
   ```
   NODE_ENV=production
   PORT=10000
   SESSION_SECRET=<generate-with-openssl-rand-base64-32>
   USE_DATABASE=true
   SUPABASE_URL=<your-supabase-project-url>
   SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
   SUPABASE_ANON_KEY=<your-supabase-anon-key>
   EMAIL_PROVIDER=smtp
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USERNAME=resend
   SMTP_PASSWORD=<your-resend-api-key>
   EMAIL_FROM=team@arogyavault.me
   EMAIL_FROM_NAME=Arogya Vault
   VAPID_PUBLIC_KEY=<your-vapid-public-key>
   VAPID_PRIVATE_KEY=<your-vapid-private-key>
   VAPID_SUBJECT=mailto:team@arogyavault.me
   ```

   **Where to find Supabase keys:**
   - Go to your Supabase project: https://supabase.com/dashboard
   - Click **Settings** → **API**
   - Copy:
     - **Project URL** → `SUPABASE_URL`
     - **service_role key** (secret) → `SUPABASE_SERVICE_ROLE_KEY`
     - **anon public key** → `SUPABASE_ANON_KEY`

   **To generate SESSION_SECRET:**
   ```bash
   openssl rand -base64 32
   ```

5. **Deploy:**
   - Click **"Create Web Service"**
   - Wait for deployment (5-10 minutes)
   - You'll get a URL like: `https://arogya-vault.onrender.com`

**✅ Done!** Your app is live at: `https://arogya-vault.onrender.com`

**Note:** Render free tier services spin down after 15 minutes of inactivity. First request after spin-down may take 30-60 seconds.

---


**Why Railway?** $5 free credit monthly, easy setup, great developer experience.

**Note:** Your database is **Supabase** (already hosted), so you only need to deploy your Express server!

### Step 1: Deploy on Railway

1. **Go to Railway:**
   - Visit https://railway.app
   - Sign up with GitHub (free)

2. **Create New Project:**
   - Click **"New Project"**
   - Select **"Deploy from GitHub repo"**
   - Choose your repository: `PBL-TANISHQ`

3. **Configure Service:**
   - Railway auto-detects your Node.js app
   - Go to your service → **"Settings"** → **"Deploy"**
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Root Directory:** Leave empty

4. **Add Environment Variables:**
   - Go to your service → **"Variables"** tab
   - Click **"+ New Variable"** and add:
   ```
   NODE_ENV=production
   PORT=3000
   SESSION_SECRET=<generate-with-openssl-rand-base64-32>
   USE_DATABASE=true
   SUPABASE_URL=<your-supabase-project-url>
   SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
   SUPABASE_ANON_KEY=<your-supabase-anon-key>
   EMAIL_PROVIDER=smtp
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USERNAME=resend
   SMTP_PASSWORD=<your-resend-api-key>
   EMAIL_FROM=team@arogyavault.me
   EMAIL_FROM_NAME=Arogya Vault
   VAPID_PUBLIC_KEY=<your-vapid-public-key>
   VAPID_PRIVATE_KEY=<your-vapid-private-key>
   VAPID_SUBJECT=mailto:team@arogyavault.me
   ```

   **Where to find Supabase keys:**
   - Go to your Supabase project: https://supabase.com/dashboard
   - Click **Settings** → **API**
   - Copy:
     - **Project URL** → `SUPABASE_URL`
     - **service_role key** (secret) → `SUPABASE_SERVICE_ROLE_KEY`
     - **anon public key** → `SUPABASE_ANON_KEY`

5. **Generate Public URL:**
   - Go to your service → **"Settings"** → **"Networking"**
   - Click **"Generate Domain"**
   - You'll get: `https://arogya-vault-production.up.railway.app`

**✅ Done!** Your app is live on Railway!

---

## 🎯 Option 4: Vercel (Possible but Requires Changes)

**Pros:**
- ✅ Stays active 24/7
- ✅ Great performance
- ✅ Free tier

**Cons:**
- ⚠️ Requires creating `vercel.json` config
- ⚠️ Sessions work differently (serverless)
- ⚠️ Background jobs (reminder scheduler) won't work
- ⚠️ File uploads need special handling

### How to Deploy to Vercel:

1. **Create `vercel.json` in project root:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "dist/public/$1"
    }
  ]
}
```

2. **Create `api/index.ts` wrapper:**
```typescript
// api/index.ts
import app from '../server/index';

export default app;
```

3. **Update Express app** to export as default instead of listening on port

4. **Deploy:**
   - Go to https://vercel.com
   - Import your GitHub repo
   - Vercel will auto-detect and deploy

**Recommendation:** Use **Railway** or **Fly.io** instead - they work with your Express app as-is!

---

## 🎯 Option 5: Cloudflare Pages + Workers

**Note:** Your app already has Cloudflare setup, but it's more complex for full-stack apps.

### Current Setup:
- Frontend: Cloudflare Pages ✅
- Backend: Needs Cloudflare Workers (requires refactoring)

**If you want to use Cloudflare:**
1. Deploy frontend to Cloudflare Pages (already documented)
2. Convert backend to Cloudflare Workers (requires significant changes)
3. Or use Cloudflare Tunnel for backend (see existing docs)

**Recommendation:** Use Render or Railway instead - easier for Express apps.

---

## 🔧 Required Environment Variables

Create a `.env.production` file or set these in your deployment platform:

### Essential:
```bash
NODE_ENV=production
PORT=10000  # Render uses 10000, Railway auto-assigns
SESSION_SECRET=<generate-with-openssl-rand-base64-32>
USE_DATABASE=true
```

### Supabase (REQUIRED - Your database):
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```

**Where to find these:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy the values:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** (secret, shown once) → `SUPABASE_SERVICE_ROLE_KEY`
   - **anon public key** → `SUPABASE_ANON_KEY`

### Email (Resend):
```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USERNAME=resend
SMTP_PASSWORD=your-resend-api-key
EMAIL_FROM=team@arogyavault.me
EMAIL_FROM_NAME=Arogya Vault
```

### Push Notifications:
```bash
VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
VAPID_SUBJECT=mailto:team@arogyavault.me
```

### Optional (SMS):
```bash
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_FROM_NUMBER=+1234567890
ENABLE_REAL_OTP=true
```

---

## 📝 Pre-Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Supabase project created and configured
- [ ] Supabase tables created (via SQL Editor or scripts)
- [ ] Supabase environment variables ready (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`)
- [ ] Build command tested locally (`npm run build`)
- [ ] Start command tested locally (`npm start`)
- [ ] Session secret generated
- [ ] VAPID keys generated (if using push notifications)
- [ ] Email/SMS credentials ready (if using)

---

## 🐛 Common Issues & Fixes

### Build Fails
- **Issue:** Missing dependencies
- **Fix:** Check `package.json` has all dependencies
- **Fix:** Ensure Node version matches (Render uses Node 18)

### Database Connection Fails
- **Issue:** Wrong Supabase credentials
- **Fix:** Verify `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_ANON_KEY` are correct
- **Fix:** Check your Supabase project is active and accessible
- **Fix:** Ensure you're using the **service_role** key (not anon key) for server operations

### CORS Errors
- **Issue:** Frontend can't call backend
- **Fix:** Since your app serves frontend and backend together, CORS shouldn't be an issue
- **Fix:** If deploying separately, add CORS middleware to `server/index.ts`

### Static Files Not Loading
- **Issue:** Build output directory wrong
- **Fix:** Verify `dist/public` contains built files
- **Fix:** Check `_redirects` file is in `dist/public`

### Environment Variables Not Working
- **Issue:** Variables not set in deployment platform
- **Fix:** Double-check variable names (case-sensitive)
- **Fix:** Redeploy after adding variables

---

## 🎉 After Deployment

1. **Test your app:**
   - Visit your frontend URL
   - Test authentication
   - Test document upload
   - Test API endpoints

2. **Monitor logs:**
   - Render: Dashboard → Service → Logs
   - Railway: Service → Deployments → View Logs
   - Fly.io: `fly logs`

3. **Set up custom domain (optional):**
   - Add your domain in platform settings
   - Update DNS records
   - Wait for propagation

---

## 💡 Recommendations

**For Quickest Setup:** Use **Render** (Option 1)
- Easiest to configure
- Free PostgreSQL included
- Automatic HTTPS
- Good documentation

**For Best Developer Experience:** Use **Railway** (Option 2)
- $5/month free credit
- Great UI
- Easy database setup
- Fast deployments

**For Maximum Performance:** Use **Vercel (Frontend) + Railway (Backend)**
- Vercel's CDN for frontend
- Railway for backend
- Best of both worlds

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Fly.io Documentation](https://fly.io/docs)
- [Vercel Documentation](https://vercel.com/docs)

---

**Need Help?** Check your deployment platform's logs or open an issue on GitHub.

