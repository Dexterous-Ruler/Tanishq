# 🚂 Railway Deployment Guide - Step by Step

Complete guide to deploy your Arogya Vault app to Railway.

---

## 📋 Prerequisites

- ✅ GitHub account with your code pushed
- ✅ Supabase project created (for database)
- ✅ Supabase API keys ready

---

## 🎯 Step 1: Prepare Your Code

### 1.1 Push Your Code to GitHub

If you haven't already, push your code:

```bash
# Navigate to your project
cd /Users/rudra/Cursor-PBL/PBL-TANISHQ

# Check git status
git status

# Add all files
git add .

# Commit changes
git commit -m "Ready for Railway deployment"

# Push to GitHub
git push origin main
```

**Verify:** Go to https://github.com and check your repository has all the latest code.

---

## 🚂 Step 2: Create Railway Account & Connect GitHub

### 2.1 Sign Up for Railway

1. Go to **https://railway.app**
2. Click **"Start a New Project"** or **"Login"**
3. Click **"Login with GitHub"**
4. Authorize Railway to access your GitHub account
5. You'll be redirected to Railway dashboard

### 2.2 Verify GitHub Connection

- Railway should automatically have access to your GitHub repos
- You'll see your repositories listed when creating a project

---

## 🚀 Step 3: Create New Project on Railway

### 3.1 Create Project

1. In Railway dashboard, click **"+ New Project"** (top right)
2. Select **"Deploy from GitHub repo"**
3. You'll see a list of your GitHub repositories
4. Find and select **`PBL-TANISHQ`** (or your repo name)
5. Click on it

### 3.2 Railway Auto-Detection

- Railway will automatically detect it's a Node.js project
- It will create a service for you
- You'll see a deployment starting automatically

**Wait:** Let the first deployment finish (it will fail initially - that's OK, we need to configure it first)

---

## ⚙️ Step 4: Configure Your Service

### 4.1 Access Service Settings

1. Click on your service (the box that appeared)
2. Click on the **"Settings"** tab (top menu)
3. Scroll down to **"Deploy"** section

### 4.2 Configure Build Settings

Set these values:

- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Root Directory:** Leave empty (or `./` if needed)
- **Watch Paths:** Leave default

### 4.3 Save Settings

- Click **"Save"** or changes auto-save

---

## 🔐 Step 5: Add Environment Variables

### 5.1 Open Variables Tab

1. Still in your service, click **"Variables"** tab (top menu)
2. You'll see an empty list or some defaults

### 5.2 Add Required Variables

Click **"+ New Variable"** for each of these:

#### Essential Variables:

```
NODE_ENV=production
```

```
PORT=3000
```

```
SESSION_SECRET=<generate-this>
```
**To generate:** Run in terminal:
```bash
openssl rand -base64 32
```
Copy the output and paste as the value.

```
USE_DATABASE=true
```

#### Supabase Variables (REQUIRED):

```
SUPABASE_URL=<your-supabase-project-url>
```

```
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

```
SUPABASE_ANON_KEY=<your-anon-key>
```

**How to get Supabase keys:**
1. Go to **https://supabase.com/dashboard**
2. Select your project
3. Click **Settings** (gear icon) → **API**
4. Copy:
   - **Project URL** → Use for `SUPABASE_URL`
   - **service_role** key (secret, shown once) → Use for `SUPABASE_SERVICE_ROLE_KEY`
   - **anon public** key → Use for `SUPABASE_ANON_KEY`

#### Email Configuration (Optional but Recommended):

```
EMAIL_PROVIDER=smtp
```

```
SMTP_HOST=smtp.resend.com
```

```
SMTP_PORT=465
```

```
SMTP_SECURE=true
```

```
SMTP_USERNAME=resend
```

```
SMTP_PASSWORD=<your-resend-api-key>
```

```
EMAIL_FROM=team@arogyavault.me
```

```
EMAIL_FROM_NAME=Arogya Vault
```

#### Push Notifications (Optional):

```
VAPID_PUBLIC_KEY=<your-vapid-public-key>
```

```
VAPID_PRIVATE_KEY=<your-vapid-private-key>
```

```
VAPID_SUBJECT=mailto:team@arogyavault.me
```

**To generate VAPID keys:**
```bash
npx tsx server/scripts/generateVAPIDKeys.ts
```

### 5.3 Verify All Variables

- Check that all variables are added
- Make sure there are no typos in variable names
- Values are correct (especially Supabase keys)

---

## 🌐 Step 6: Generate Public URL

### 6.1 Get Your Domain

1. In your service, go to **"Settings"** tab
2. Scroll to **"Networking"** section
3. Click **"Generate Domain"** button
4. Railway will create a domain like: `arogya-vault-production.up.railway.app`

### 6.2 Copy Your URL

- Copy the generated URL
- This is your app's public URL
- You can share this with anyone!

---

## 🔄 Step 7: Trigger Deployment

### 7.1 Manual Redeploy

1. Go to **"Deployments"** tab
2. Click **"Redeploy"** on the latest deployment
3. Or click **"Deploy"** button (top right)

### 7.2 Watch Deployment

- You'll see build logs in real-time
- Wait for deployment to complete (usually 3-5 minutes)
- Look for "Deployment successful" message

---

## ✅ Step 8: Verify Deployment

### 8.1 Test Your App

1. Open your Railway URL in browser: `https://your-app.up.railway.app`
2. You should see your app loading
3. Test basic functionality:
   - Homepage loads
   - Try authentication
   - Check API endpoints

### 8.2 Check Logs

1. In Railway, go to **"Deployments"** tab
2. Click on the latest deployment
3. Click **"View Logs"** to see server logs
4. Check for any errors

---

## 🔄 Step 9: Auto-Deploy from GitHub (Already Set Up!)

**Good news:** Railway is already connected to your GitHub!

### 9.1 How It Works

- Every time you push to `main` branch, Railway automatically deploys
- No manual steps needed!

### 9.2 Push Updates

```bash
# Make your changes
# ... edit files ...

# Commit changes
git add .
git commit -m "Update: description of changes"

# Push to GitHub
git push origin main
```

### 9.3 Watch Auto-Deploy

1. Go to Railway dashboard
2. You'll see a new deployment starting automatically
3. Wait for it to complete (usually 3-5 minutes)
4. Your changes are live!

---

## 🐛 Troubleshooting

### Build Fails

**Problem:** Deployment fails during build

**Solutions:**
1. Check build logs in Railway
2. Verify `package.json` has all dependencies
3. Check Node version (Railway uses Node 18+)
4. Ensure `npm run build` works locally

### App Not Loading

**Problem:** App shows error or blank page

**Solutions:**
1. Check deployment logs for errors
2. Verify all environment variables are set
3. Check Supabase credentials are correct
4. Verify `PORT` is set to `3000`

### Database Connection Errors

**Problem:** Can't connect to Supabase

**Solutions:**
1. Verify `SUPABASE_URL` is correct (no trailing slash)
2. Check `SUPABASE_SERVICE_ROLE_KEY` is the service_role key (not anon)
3. Ensure Supabase project is active
4. Check Supabase project settings → API

### Environment Variables Not Working

**Problem:** Variables not being read

**Solutions:**
1. Verify variable names are exact (case-sensitive)
2. Check for extra spaces in values
3. Redeploy after adding new variables
4. Check logs for variable-related errors

---

## 📊 Monitoring Your App

### View Logs

1. Go to your service
2. Click **"Deployments"** tab
3. Click on any deployment
4. Click **"View Logs"**

### View Metrics

1. Go to your service
2. Click **"Metrics"** tab
3. See CPU, Memory, Network usage

### View Activity

1. Go to your service
2. Click **"Activity"** tab
3. See all deployments and changes

---

## 💰 Railway Pricing

### Free Tier

- **$5/month credit** (free)
- Usually enough for small apps
- Pay-as-you-go after credit

### Usage

- Check usage in Railway dashboard
- You'll see how much credit is used
- Upgrade if needed (but free tier is usually enough)

---

## 🔒 Security Best Practices

### 1. Never Commit Secrets

- ✅ Use Railway environment variables
- ❌ Don't commit `.env` files to GitHub

### 2. Use Service Role Key

- Use `SUPABASE_SERVICE_ROLE_KEY` (not anon key) for server operations
- Anon key is for client-side only

### 3. Rotate Secrets

- Change `SESSION_SECRET` periodically
- Rotate Supabase keys if compromised

---

## 🎉 Success Checklist

- [ ] Code pushed to GitHub
- [ ] Railway account created
- [ ] Project created and connected to GitHub
- [ ] Service configured (build/start commands)
- [ ] All environment variables added
- [ ] Public URL generated
- [ ] Deployment successful
- [ ] App loads in browser
- [ ] Tested basic functionality
- [ ] Auto-deploy working (push to GitHub)

---

## 📝 Quick Reference

### Railway Dashboard
- **URL:** https://railway.app
- **Projects:** List of all your projects
- **Services:** Individual apps/services
- **Deployments:** History of all deployments
- **Variables:** Environment variables
- **Settings:** Configuration

### Common Commands

```bash
# Push updates (triggers auto-deploy)
git add .
git commit -m "Your message"
git push origin main

# Check Railway CLI (optional)
railway login
railway status
railway logs
```

### Your App URL

After deployment, your app will be at:
```
https://your-app-name.up.railway.app
```

---

## 🆘 Need Help?

1. **Check Railway Docs:** https://docs.railway.app
2. **View Logs:** Railway dashboard → Deployments → View Logs
3. **Railway Discord:** Join Railway community
4. **GitHub Issues:** Check your repo for issues

---

## 🎯 Next Steps

1. ✅ Deploy to Railway (you're doing this!)
2. ✅ Test your app
3. ✅ Set up custom domain (optional)
4. ✅ Monitor usage
5. ✅ Push updates as needed

**Your app is now live on Railway! 🚀**

---

**Last Updated:** Based on your current setup with Supabase backend.

