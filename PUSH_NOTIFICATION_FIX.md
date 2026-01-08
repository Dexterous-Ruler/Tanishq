# Push Notification Fix Guide

## Quick Fixes

### 1. Clear Service Worker Cache
If service worker is stuck:
1. Open Chrome DevTools (F12)
2. Go to **Application** → **Service Workers**
3. Click **Unregister** for any existing service workers
4. Go to **Application** → **Storage** → **Clear site data**
5. Refresh the page

### 2. Re-enable Notifications
1. Go to **Profile** → **Settings**
2. Scroll to **Notifications** section
3. If permission is "default", click **Grant Permission**
4. Toggle **Browser Notifications** ON
5. Click **Send Test Notification**

### 3. Check Browser Console
Open browser console (F12) and look for:
- `[Push] Service worker registered`
- `[Push] Service worker ready`
- `[Push] Subscribed to push notifications`
- `[Push] Push notifications setup complete`

### 4. Verify Service Worker File
Check if service worker is accessible:
```bash
curl http://localhost:3000/sw.js
```
Should return JavaScript code, not 404.

### 5. Test in Browser Console
Run this in browser console:
```javascript
// Check service worker
navigator.serviceWorker.getRegistration().then(reg => {
  console.log("SW Registered:", !!reg);
  console.log("SW Active:", reg?.active?.state);
});

// Check permission
console.log("Permission:", Notification.permission);

// Check subscription
navigator.serviceWorker.getRegistration().then(async reg => {
  const sub = await reg?.pushManager?.getSubscription();
  console.log("Subscribed:", !!sub);
});
```

## Common Issues

### Issue: Service Worker Not Registering
**Fix**: 
- Check browser console for errors
- Verify `/sw.js` is accessible
- Clear browser cache
- Try incognito mode

### Issue: Permission Denied
**Fix**:
- Go to browser settings
- Allow notifications for localhost:3000
- Or reset permission and grant again

### Issue: Subscription Not Created
**Fix**:
- Make sure permission is "granted"
- Check browser console for subscription errors
- Verify VAPID public key matches server

### Issue: Notifications Not Appearing
**Fix**:
- Check service worker console (DevTools → Application → Service Workers → Console)
- Verify service worker is active
- Check browser notification settings
- Disable "Do Not Disturb" mode

## Server-Side Checks

### Verify VAPID Keys
```bash
curl http://localhost:3000/api/push/public-key
```
Should return: `{"success":true,"publicKey":"..."}`

### Check Server Logs
When server starts, should see:
```
✅ Push notification service initialized
   VAPID Subject: mailto:team@arogyavault.me
   VAPID Public Key: BNt8MFeuMkLWRfEOkzA3...
```

## Testing Steps

1. **Enable Notifications**:
   - Go to Profile → Settings
   - Grant permission if needed
   - Toggle Browser Notifications ON

2. **Send Test Notification**:
   - Click "Send Test Notification" button
   - Notification should appear

3. **Check Service Worker**:
   - DevTools → Application → Service Workers
   - Should see `sw.js` registered and active

4. **Check Subscriptions**:
   - Browser console: Check if subscription exists
   - Server: Check `/api/push/subscriptions` endpoint

