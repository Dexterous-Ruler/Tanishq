# Debugging Push Notifications

## Issue: Test notification not appearing

### Step 1: Check Service Worker Registration

1. Open Chrome DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers** in the left sidebar
4. Check if `sw.js` is registered and shows status "activated and is running"
5. If not registered, refresh the page

### Step 2: Check Browser Console

1. Open Chrome DevTools (F12)
2. Go to **Console** tab
3. Look for messages like:
   - `[Service Worker] Push event received`
   - `[Service Worker] Parsed push data:`
   - `[Service Worker] Showing notification with data:`
   - `[Service Worker] Notification shown successfully`

### Step 3: Check Notification Permission

In the browser console, run:
```javascript
Notification.permission
```

Should return: `"granted"`

If not granted:
1. Go to Chrome Settings > Privacy and security > Site settings > Notifications
2. Make sure localhost:3000 (or your tunnel URL) is allowed
3. Or reset and grant permission again in Profile Settings

### Step 4: Test Service Worker Manually

In Chrome DevTools > Application > Service Workers:
1. Find your service worker
2. Click **Push** button to simulate a push event
3. You should see a notification appear

### Step 5: Check Server Logs

The server logs show:
```
✅ Push notification sent to https://fcm.googleapis.com/fcm/send/...
```

This means the notification was sent successfully to the push service.

### Step 6: Verify Service Worker is Active

In the browser console, run:
```javascript
navigator.serviceWorker.getRegistration().then(reg => {
  console.log("Service Worker:", reg);
  console.log("Active:", reg?.active);
  console.log("Scope:", reg?.scope);
});
```

### Step 7: Check Network Tab

1. Open Chrome DevTools > Network tab
2. Send a test notification
3. Look for requests to `/api/push/test`
4. Check the response - should be `{"success": true, "message": "Test notification sent"}`

### Common Issues

1. **Service Worker not registered**
   - Solution: Refresh the page or re-enable notifications in Profile Settings

2. **Permission denied**
   - Solution: Grant permission in browser settings or Profile Settings

3. **Service Worker scope issue**
   - Solution: Make sure `sw.js` is served from root (`/sw.js`)

4. **Browser blocking notifications**
   - Solution: Check browser notification settings, disable "Do Not Disturb" mode

5. **Service Worker not receiving push events**
   - Solution: Check browser console for service worker errors

### Testing Checklist

- [ ] Service worker is registered and active
- [ ] Notification permission is "granted"
- [ ] Server logs show "✅ Push notification sent"
- [ ] Browser console shows "[Service Worker] Push event received"
- [ ] Browser console shows "[Service Worker] Notification shown successfully"
- [ ] Notification appears in browser/system notification area

### Manual Test

You can manually trigger a notification in the service worker:

1. Open Chrome DevTools > Application > Service Workers
2. Click **Push** button
3. Notification should appear

If manual push works but API push doesn't, the issue is with the payload format or encryption.

