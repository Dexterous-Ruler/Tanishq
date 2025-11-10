# How to Test Push Notifications

## Step 1: Subscribe to Push Notifications

1. **Open the app in Chrome**: `http://localhost:3000`
2. **Log in** to your account
3. **Navigate to Profile Settings** (click on profile icon)
4. **Scroll to "Notifications" section**
5. **Click "Grant Permission"** button (if permission is not granted)
6. **Toggle the switch** to enable Browser Notifications
7. **You should see**: "✅ Notifications are active"

## Step 2: Test Push Notification

### Option A: Using the UI (Easiest)
- In Profile Settings, click **"Send Test Notification"** button
- You should see a notification appear in your browser

### Option B: Using the API Endpoint
Once you're logged in, you can use the test endpoint:

```bash
# Make sure you're logged in first (cookies will be sent automatically)
curl -X POST http://localhost:3000/api/push/test \
  -H "Content-Type: application/json" \
  --cookie-jar cookies.txt \
  --cookie cookies.txt
```

### Option C: Using the Script
After subscribing, you can use the test script:

```bash
# First, get your user ID from the database or use the API
# Then run:
npx tsx server/scripts/sendTestPushNotification.ts <your-user-id>
```

## Troubleshooting

### No subscriptions found
- Make sure you've enabled notifications in Profile Settings
- Check browser console for any errors
- Verify service worker is registered (check DevTools > Application > Service Workers)

### Permission denied
- Go to Chrome Settings > Privacy and security > Site settings > Notifications
- Make sure localhost:3000 is allowed
- Or reset and grant permission again

### Notification not appearing
- Make sure browser is open (or service worker is active)
- Check browser notification settings
- Verify VAPID keys are set in .env file
- Check server logs for errors

## Verify Service Worker

1. Open Chrome DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers** in the left sidebar
4. You should see `sw.js` registered and active
5. If not, refresh the page

## Check Push Subscriptions

You can verify your subscription in the database:

```sql
SELECT id, user_id, endpoint, user_agent, created_at 
FROM public.push_subscriptions;
```

