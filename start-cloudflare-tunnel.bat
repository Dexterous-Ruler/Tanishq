@echo off
REM Cloudflare Tunnel Startup Script for Windows
REM This script starts your app and exposes it via Cloudflare Tunnel

echo 🚀 Starting Arogya Vault with Cloudflare Tunnel...

REM Check if cloudflared is installed
where cloudflared >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ cloudflared is not installed!
    echo Install it from: https://github.com/cloudflare/cloudflared/releases
    pause
    exit /b 1
)

REM Start the app in background
echo 📦 Starting application...
start /B npm run dev

REM Wait for app to be ready
echo ⏳ Waiting for app to start...
timeout /t 5 /nobreak >nul

REM Start Cloudflare tunnel
echo 🌐 Starting Cloudflare tunnel...
echo Your shareable link will appear below:
echo.

cloudflared tunnel run arogya-vault

pause

