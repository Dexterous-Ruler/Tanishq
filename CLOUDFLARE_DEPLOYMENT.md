# 🚀 Cloudflare Deployment Guide - Arogya Vault

This guide will help you deploy your Arogya Vault application to Cloudflare and get a shareable link.

## 📋 Prerequisites

1. **Cloudflare Account** (Free) - Sign up at https://dash.cloudflare.com/sign-up
2. **GitHub Account** - Your code should be pushed to GitHub
3. **Node.js installed** - For local development/testing

---

## 🎯 Quick Start: Deploy to Cloudflare Pages (Recommended)

### Step 1: Install Dependencies

```bash
npm install
```

This will install `cross-env` and other dependencies needed for deployment.

### Step 2: Build Your Application

```bash
npm run build
```

This will:
- Build your React frontend
- Bundle your Express backend
- Copy necessary files for deployment

### Step 3: Deploy to Cloudflare Pages

#### Option A: Via Cloudflare Dashboard (Easiest)

1. **Go to Cloudflare Dashboard:**
   - Visit https://dash.cloudflare.com
   - Click on **Pages** in the sidebar
   - Click **Create a project**

2. **Connect GitHub:**
   - Click **Connect to Git**
   - Authorize Cloudflare to access your GitHub
   - Select your repository: `PBL-TANISHQ`

3. **Configure Build Settings:**
   - **Project name:** `arogya-vault` (or any name you like)
   - **Production branch:** `main`
   - **Build command:** `npm install && npm run build`
   - **Build output directory:** `dist/public`
   - **Root directory:** `/` (leave empty)

4. **Add Environment Variables:**
   Click **Environment variables** and add:
   ```
   NODE_ENV=production
   PORT=3000
   SESSION_SECRET=your-secret-key-here
   ```
   
   For production, generate a secure session secret:
   ```bash
   openssl rand -base64 32
   ```

5. **Deploy:**
   - Click **Save and Deploy**
   - Wait for build to complete (2-5 minutes)
   - You'll get a URL like: `https://arogya-vault.pages.dev`

#### Option B: Via Wrangler CLI

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
wrangler pages deploy dist/public --project-name=arogya-vault
```

---

## 🌐 Option 2: Cloudflare Tunnel (For Backend API)

If you need to expose your backend API separately:

### Step 1: Install Cloudflare Tunnel

**Windows:**
```powershell
# Download from: https://github.com/cloudflare/cloudflared/releases
# Or use winget:
winget install --id Cloudflare.cloudflared
```

**macOS:**
```bash
brew install cloudflared
```

**Linux:**
```bash
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
```

### Step 2: Login and Create Tunnel

```bash
# Login to Cloudflare
cloudflared tunnel login

# Create a tunnel
cloudflared tunnel create arogya-vault-backend
```

### Step 3: Configure Tunnel

Create `~/.cloudflared/config.yml` (Windows: `%USERPROFILE%\.cloudflared\config.yml`):

```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: ~/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: api.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
```

### Step 4: Run Your App and Tunnel

**Windows:**
```cmd
start-cloudflare-tunnel.bat
```

**macOS/Linux:**
```bash
chmod +x start-cloudflare-tunnel.sh
./start-cloudflare-tunnel.sh
```

Or manually:
```bash
# Terminal 1: Start your app
npm run dev

# Terminal 2: Start tunnel
cloudflared tunnel run arogya-vault-backend
```

You'll get a URL like: `https://arogya-vault-backend-xxxxx.trycloudflare.com`

---

## 🔧 Environment Variables

Set these in Cloudflare Pages Dashboard → Settings → Environment Variables:

### Required:
- `NODE_ENV=production`
- `PORT=3000` (Cloudflare Pages sets this automatically)
- `SESSION_SECRET` - Generate with: `openssl rand -base64 32`

### Optional (if using these features):
- `TWILIO_ACCOUNT_SID` - For SMS OTP
- `TWILIO_AUTH_TOKEN` - For SMS OTP
- `TWILIO_FROM_NUMBER` - For SMS OTP
- `ENABLE_REAL_OTP=true` - Enable real SMS
- `SUPABASE_URL` - For Supabase storage
- `SUPABASE_SERVICE_ROLE_KEY` - For Supabase storage
- `OPENAI_API_KEY` - For AI features

---

## 📝 Custom Domain (Optional)

1. **Add Domain in Cloudflare:**
   - Go to Pages → Your Project → Custom domains
   - Click **Set up a custom domain**
   - Enter your domain (e.g., `arogya-vault.com`)

2. **Update DNS:**
   - Cloudflare will provide DNS records
   - Add them to your domain's DNS settings
   - Wait for DNS propagation (5-30 minutes)

---

## 🧪 Testing Your Deployment

1. **Visit your URL:**
   ```
   https://your-app.pages.dev
   ```

2. **Test API endpoints:**
   ```
   https://your-app.pages.dev/api/health
   ```

3. **Test frontend:**
   - Navigate through the app
   - Test authentication
   - Test document upload (if configured)

---

## 🐛 Troubleshooting

### Build Fails?

1. **Check build logs** in Cloudflare Dashboard
2. **Test build locally:**
   ```bash
   npm run build
   ```
3. **Check Node version** - Cloudflare uses Node 18 by default

### Environment Variables Not Working?

1. **Verify variables are set** in Cloudflare Dashboard
2. **Redeploy** after adding new variables
3. **Check variable names** - they're case-sensitive

### CORS Errors?

- Cloudflare Pages handles CORS automatically
- If using separate backend, configure CORS in Express

### App Not Loading?

1. **Check `_redirects` file** is in `dist/public/`
2. **Verify build output** directory is correct
3. **Check browser console** for errors

---

## 📦 Files Created

- `cloudflare-pages.json` - Cloudflare Pages configuration
- `_redirects` - URL rewriting rules
- `wrangler.toml` - Cloudflare Workers configuration
- `start-cloudflare-tunnel.sh` - Tunnel startup script (macOS/Linux)
- `start-cloudflare-tunnel.bat` - Tunnel startup script (Windows)
- `cloudflare-tunnel-setup.md` - Detailed tunnel setup guide

---

## 🎉 Share Your Link!

Once deployed, you'll get a shareable link:
- **Cloudflare Pages:** `https://your-app.pages.dev`
- **Custom Domain:** `https://yourdomain.com`
- **Tunnel (temporary):** `https://your-app-xxxxx.trycloudflare.com`

Share this link with anyone! 🚀

---

## 📚 Additional Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Cloudflare Tunnel Docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)

---

**Need Help?** Check the logs in Cloudflare Dashboard or open an issue on GitHub.

