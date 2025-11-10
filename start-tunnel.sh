#!/bin/bash

# Script to start Cloudflare Tunnel for shareable link
# Usage: ./start-tunnel.sh

echo "🌐 Starting Cloudflare Tunnel..."
echo ""
echo "This will create a public shareable link for your app."
echo "Look for the URL that starts with 'https://' and ends with '.trycloudflare.com'"
echo ""
echo "Press Ctrl+C to stop the tunnel."
echo ""

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "⚠️  Warning: Server doesn't seem to be running on port 3000"
    echo "   Start it with: npm run dev"
    echo ""
fi

# Kill any existing cloudflared processes
pkill -f cloudflared 2>/dev/null
sleep 1

# Start tunnel
npx --yes cloudflared tunnel --url http://localhost:3000
