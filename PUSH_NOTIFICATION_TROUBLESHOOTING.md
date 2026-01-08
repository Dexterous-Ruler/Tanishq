# Push Notification Troubleshooting Guide

## Quick Diagnostic Steps

### 1. Check Server Initialization
When the server starts, you should see:
```
✅ Push notification service initialized
   VAPID Subject: mailto:team@arogyavault.me
   VAPID Public Key: BNt8MFeuMkLWRfEOkzA3...
```

If you see:
```
⚠️  VAPID keys not configured, push notifications will not work
```
→ Check your `.env` file has `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` set

### 2. Check Service Worker Registration
Open browser console and run:
```javascript
navigator.serviceWorker.getRegistration().then(reg => {
  console.log("Service Worker:", reg ? "Registered" : "Not registered");
  console.log("Active:", reg?.active?.state);
  console.log("Scope:", reg?.scope);
});
```

Expected: `Registered`, `activated`, `/`

### 3. Check Notification Permission
In browser console:
```javascript
Notification.permission
```

Expected: `"granted"`

### 4. Check Push Subscription
In browser console:
```javascript
navigator.serviceWorker.getRegistration().then(async reg => {
  const sub = await reg?.pushManager?.getSubscription();
  console.log("Subscription:", sub ? "Exists" : "Not subscribed");
  if (sub) {
    console.log("Endpoint:", sub.endpoint.substring(0, 50) + "...");
  }
});
```

### 5. Test Public Key Endpoint
```bash
curl http://localhost:3000/api/push/public-key
```

Expected: `{"success":true,"publicKey":"BNt8MFeuMkLWRfEOkzA3..."}`

### 6. Test Subscription Endpoint
After enabling notifications in the app, check:
```bash
curl -X GET http://localhost:3000/api/push/subscriptions \
  -H "Cookie: your-session-cookie"
```

Expected: List of subscriptions

## Common Issues & Fixes

### Issue 1: Service Worker Not Registering
**Symptoms:**
- No service worker in DevTools > Application > Service Workers
- Console error: "Failed to register service worker"

**Fixes:**
1. Check if `/sw.js` is accessible: `curl http://localhost:3000/sw.js`
2. Check browser console for registration errors
3. Clear browser cache and reload
4. Check if service worker file exists in `dist/public/sw.js` (production)

### Issue 2: Permission Denied
**Symptoms:**
- `Notification.permission` returns `"denied"`
- Cannot enable notifications in Profile Settings

**Fixes:**
1. Go to browser settings (Chrome: Settings > Privacy > Site settings > Notifications)
2. Find `localhost:3000` and set to "Allow"
3. Or reset and grant permission again in Profile Settings

### Issue 3: No Push Subscriptions
**Symptoms:**
- Service worker registered but no subscriptions
- `/api/push/subscriptions` returns empty array

**Fixes:**
1. Make sure notification permission is granted
2. Try enabling notifications again in Profile Settings
3. Check browser console for subscription errors
4. Verify VAPID public key matches between server and client

### Issue 4: Notifications Not Appearing
**Symptoms:**
- Server logs show "✅ Push notification sent"
- But no notification appears

**Fixes:**
1. Check service worker console (DevTools > Application > Service Workers > Console)
2. Look for "[Service Worker] Push event received"
3. Check if browser is in "Do Not Disturb" mode
4. Check browser notification settings
5. Test with manual push in DevTools (Application > Service Workers > Push button)

### Issue 5: Service Worker Not Receiving Push Events
**Symptoms:**
- Server sends notification successfully
- But service worker doesn't receive it

**Fixes:**
1. Check service worker is active (not just installed)
2. Verify service worker scope matches subscription scope
3. Check service worker console for errors
4. Try unregistering and re-registering service worker

## Testing Push Notifications

### Method 1: Use Test Endpoint
1. Enable notifications in Profile Settings
2. Send test notification:
```bash
curl -X POST http://localhost:3000/api/push/test \
  -H "Cookie: your-session-cookie" \
  -H "Content-Type: application/json"
```

### Method 2: Manual Service Worker Push
1. Open DevTools > Application > Service Workers
2. Find your service worker
3. Click "Push" button
4. Notification should appear

### Method 3: Medication Reminder
1. Add a medication with a reminder time
2. Wait for the scheduled time (or manually trigger)
3. Notification should appear

## Browser-Specific Notes

### Chrome/Edge
- Full support for push notifications
- Service workers work in background
- Notifications appear even when browser is closed

### Firefox
- Full support for push notifications
- Service workers work in background

### Safari (Desktop)
- Supports service workers
- Push notifications work

### Safari (iOS)
- ❌ **NOT SUPPORTED** - iOS Safari doesn't support Web Push API
- Requires native app for push notifications

## Debugging Checklist

- [ ] VAPID keys configured in `.env`
- [ ] Server shows "✅ Push notification service initialized"
- [ ] Service worker registered (`/sw.js` accessible)
- [ ] Service worker is active (not just installed)
- [ ] Notification permission is "granted"
- [ ] Push subscription exists (check in browser console)
- [ ] Subscription saved in database (check `/api/push/subscriptions`)
- [ ] Server can send notifications (check server logs)
- [ ] Service worker receives push events (check service worker console)
- [ ] Browser notification settings allow notifications
- [ ] Not in "Do Not Disturb" mode

## Server Logs to Check

When sending a notification, you should see:
```
✅ Push notification sent to https://fcm.googleapis.com/fcm/send/...
```

If you see:
```
⚠️  [Push] Service not initialized, skipping notification
```
→ VAPID keys not configured

If you see:
```
[Push] Subscription expired: ...
```
→ Subscription needs to be re-registered

If you see:
```
[Push] Failed to send notification: ...
```
→ Check error message for details

