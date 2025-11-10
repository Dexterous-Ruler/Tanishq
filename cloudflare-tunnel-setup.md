# Cloudflare Tunnel Setup Guide

This guide will help you deploy your Arogya Vault application using Cloudflare Tunnel to get a shareable link.

## Option 1: Cloudflare Tunnel (Easiest - Expose Local/Any Backend)

### Step 1: Install Cloudflare Tunnel (cloudflared)

**Windows:**
```powershell
# Download from: https://github.com/cloudflare/cloudflared/releases
# Or use Chocolatey:
choco install cloudflared

# Or use winget:
winget install --id Cloudflare.cloudflared
```

**macOS:**
```bash
brew install cloudflared
```

**Linux:**
```bash
# Download binary
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
```

### Step 2: Login to Cloudflare

```bash
cloudflared tunnel login
```

This will open your browser to authorize the tunnel.

### Step 3: Create a Tunnel

```bash
cloudflared tunnel create arogya-vault
```

This will create a tunnel and give you a tunnel ID.

### Step 4: Create Configuration File

Create `~/.cloudflared/config.yml` (or `%USERPROFILE%\.cloudflared\config.yml` on Windows):

```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: ~/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  # Route API requests
  - hostname: api.yourdomain.com
    service: http://localhost:3000
  
  # Route all other traffic to your app
  - hostname: yourdomain.com
    service: http://localhost:3000
  
  # Catch-all rule
  - service: http_status:404
```

### Step 5: Run Your App Locally

```bash
npm run dev
```

### Step 6: Start the Tunnel

```bash
cloudflared tunnel run arogya-vault
```

You'll get a URL like: `https://arogya-vault-xxxxx.trycloudflare.com`

### Step 7: (Optional) Configure Custom Domain

1. Go to Cloudflare Dashboard → Zero Trust → Tunnels
2. Select your tunnel
3. Add a public hostname
4. Point your domain to Cloudflare nameservers

---

## Option 2: Cloudflare Pages (Frontend) + Tunnel (Backend)

### Deploy Frontend to Cloudflare Pages

1. **Build your frontend:**
   ```bash
   npm run build
   ```

2. **Go to Cloudflare Dashboard:**
   - Visit https://dash.cloudflare.com
   - Go to Pages → Create a project
   - Connect your GitHub repository

3. **Configure Build Settings:**
   - Build command: `npm run build`
   - Build output directory: `dist/public`
   - Root directory: `/`

4. **Deploy:**
   - Cloudflare will automatically deploy on every push to main branch
   - You'll get a URL like: `your-app.pages.dev`

### Deploy Backend via Tunnel

Follow Option 1 steps to expose your backend.

### Update Frontend API URL

Update your frontend API configuration to point to your tunnel URL.

---

## Option 3: Full Cloudflare Pages Deployment

For a simpler setup, deploy everything to Cloudflare Pages:

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Deploy to Cloudflare Pages:**
   - Connect GitHub repo
   - Build command: `npm run build`
   - Output directory: `dist/public`

3. **Configure Environment Variables:**
   - Go to Pages → Settings → Environment Variables
   - Add all your `.env` variables

4. **Get your shareable link:**
   - Cloudflare will provide: `your-app.pages.dev`
   - You can add a custom domain for free

---

## Quick Start Script

Create a file `start-cloudflare.sh`:

```bash
#!/bin/bash

# Start your app
npm run dev &

# Wait for app to start
sleep 5

# Start Cloudflare tunnel
cloudflared tunnel run arogya-vault
```

Make it executable:
```bash
chmod +x start-cloudflare.sh
```

Run it:
```bash
./start-cloudflare.sh
```

---

## Troubleshooting

### Tunnel not connecting?
- Make sure your app is running on the correct port
- Check firewall settings
- Verify tunnel credentials

### CORS errors?
- Add CORS headers in your Express app
- Configure Cloudflare Workers CORS settings

### Environment variables not working?
- Set them in Cloudflare Dashboard
- Or use `wrangler secret put VARIABLE_NAME`

---

## Shareable Link

Once deployed, you'll get a URL like:
- `https://your-app.pages.dev` (Cloudflare Pages)
- `https://your-app-xxxxx.trycloudflare.com` (Tunnel - temporary)
- `https://yourdomain.com` (Custom domain)

Share this link with anyone!

