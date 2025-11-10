# 🌐 Shareable Link for Arogya Vault

## Quick Start - Get Your Shareable Link

### Step 1: Make sure your server is running
```bash
npm run dev
```

### Step 2: Start Cloudflare Tunnel
```bash
./start-tunnel.sh
```

Or manually:
```bash
npx --yes cloudflared tunnel --url http://localhost:3000
```

### Step 3: Copy the Shareable Link

After running the tunnel, you'll see output like:
```
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable): |
|  https://random-words-here.trycloudflare.com                                               |
+--------------------------------------------------------------------------------------------+
```

**Copy that URL** - that's your shareable link! 📋

---

## Current Shareable Link

**Your link will appear here after starting the tunnel.**

To get a new link:
1. Make sure server is running (`npm run dev`)
2. Run `./start-tunnel.sh`
3. Copy the URL from the terminal output

---

## How to Share

Simply send the link to anyone:
```
https://your-random-url.trycloudflare.com
```

They can:
- ✅ Open it on any device (phone, tablet, laptop)
- ✅ Access from anywhere (not just same WiFi)
- ✅ Use all features of your app

---

## Important Notes

⚠️ **Tunnel Limitations:**
- Free Cloudflare tunnels are temporary
- URL changes each time you restart the tunnel
- For a permanent link, you need a named tunnel (see below)

💡 **For a Permanent Link:**

Create a named tunnel for a stable URL:

```bash
# Install cloudflared (if not already installed)
brew install cloudflared  # macOS
# or download from: https://github.com/cloudflare/cloudflared/releases

# Login to Cloudflare
cloudflared tunnel login

# Create a named tunnel
cloudflared tunnel create arogya-vault

# Run the tunnel
cloudflared tunnel run arogya-vault
```

Then configure it in Cloudflare Dashboard for a custom domain.

---

## Quick Commands

```bash
# Start server
npm run dev

# Start tunnel (in another terminal)
./start-tunnel.sh

# Stop tunnel
pkill -f cloudflared

# Check if tunnel is running
ps aux | grep cloudflared
```

---

## Troubleshooting

### Link Not Working?
1. Make sure server is running: `npm run dev`
2. Check tunnel is running: `ps aux | grep cloudflared`
3. Restart tunnel: `./start-tunnel.sh`

### Can't Access from Phone?
- Make sure you're using the `trycloudflare.com` URL (not localhost)
- Check that the tunnel is still running
- Try restarting the tunnel

---

*Last Updated: $(date)*
