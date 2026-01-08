# Deployment URL Configuration Guide

## Overview
This guide explains how shareable URLs (consents and emergency cards) automatically adapt to your deployment domain.

## How It Works

### Automatic Domain Detection
The application automatically detects the deployment domain from incoming requests. This means:
- **No code changes needed** when deploying to different platforms
- **Works with any hosting provider** (Railway, Render, Vercel, etc.)
- **Automatically uses HTTPS** when behind a proxy

### Priority Order
URLs are generated in this priority order:

1. **`FRONTEND_URL` environment variable** (highest priority)
   - Set this if you want to explicitly control the domain
   - Example: `FRONTEND_URL=https://your-app.com`

2. **`RAILWAY_PUBLIC_DOMAIN` environment variable** (Railway-specific)
   - Automatically set by Railway
   - Example: `RAILWAY_PUBLIC_DOMAIN=your-app.up.railway.app`

3. **Request-based detection** (automatic)
   - Detects domain from `Host` header
   - Detects protocol from `X-Forwarded-Proto` header
   - Works automatically in production

4. **Config defaults** (fallback)
   - Production: `https://pbl-tanishq-production.up.railway.app`
   - Development: `http://localhost:3000`

## For Deployment

### Option 1: Automatic (Recommended)
**Do nothing!** The app will automatically detect your deployment domain from requests.

When you deploy:
- Shareable consent URLs will use: `https://your-deployment-domain.com/share/{token}`
- Emergency card QR codes will use: `https://your-deployment-domain.com/emergency/view/{token}`

### Option 2: Explicit Configuration
If you want to explicitly set the domain, add to your environment variables:

```bash
FRONTEND_URL=https://your-actual-domain.com
```

**Important**: 
- Use `https://` for production
- No trailing slash
- This will override automatic detection

## Examples

### Railway Deployment
```bash
# Automatic - no config needed
# URLs will be: https://your-app.up.railway.app/share/{token}

# Or explicit:
FRONTEND_URL=https://your-app.up.railway.app
```

### Render Deployment
```bash
# Automatic - no config needed
# URLs will be: https://your-app.onrender.com/share/{token}

# Or explicit:
FRONTEND_URL=https://your-app.onrender.com
```

### Custom Domain
```bash
# Explicit configuration required
FRONTEND_URL=https://arogyavault.com
```

## Testing

### Local Development
- URLs will use: `http://localhost:3000/share/{token}`
- This is correct for local testing

### Production
- URLs will automatically use your deployment domain
- Check the generated QR codes and share links to verify

## What Was Fixed

### 1. Document List Endpoint
- Now includes AI analysis fields (`extractedText`, `aiInsight`, `ocrProcessed`)
- Frontend can now display analysis status for all documents

### 2. URL Generation
- Automatically detects deployment domain from requests
- Works with any hosting platform
- No hardcoded localhost URLs in production

## Verification

After deployment, verify URLs are correct:

1. **Create a consent** and check the shareable URL
2. **Create an emergency card** and scan the QR code
3. **Verify URLs** use your deployment domain, not localhost

If URLs still show localhost:
- Check that `FRONTEND_URL` is not set to localhost
- Verify the deployment is receiving requests with correct `Host` header
- Check server logs for URL generation

