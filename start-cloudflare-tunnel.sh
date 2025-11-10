#!/bin/bash

# Cloudflare Tunnel Startup Script
# This script starts your app and exposes it via Cloudflare Tunnel

echo "🚀 Starting Arogya Vault with Cloudflare Tunnel..."

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "❌ cloudflared is not installed!"
    echo "Install it from: https://github.com/cloudflare/cloudflared/releases"
    exit 1
fi

# Check if tunnel exists
if [ ! -f ~/.cloudflared/config.yml ]; then
    echo "⚠️  Cloudflare tunnel not configured!"
    echo "Run: cloudflared tunnel login"
    echo "Then: cloudflared tunnel create arogya-vault"
    exit 1
fi

# Start the app in background
echo "📦 Starting application..."
npm run dev &
APP_PID=$!

# Wait for app to be ready
echo "⏳ Waiting for app to start..."
sleep 5

# Check if app is running
if ! curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "⚠️  App might not be ready yet, but starting tunnel anyway..."
fi

# Start Cloudflare tunnel
echo "🌐 Starting Cloudflare tunnel..."
echo "Your shareable link will appear below:"
echo ""

cloudflared tunnel run arogya-vault

# Cleanup on exit
trap "kill $APP_PID 2>/dev/null" EXIT

