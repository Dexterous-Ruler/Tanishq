# Mobile Push Notifications Guide

## ✅ Supported Platforms

### Android (✅ Full Support)
- **Chrome for Android**: ✅ Fully supported
- **Samsung Internet**: ✅ Supported
- **Firefox for Android**: ✅ Supported
- **Edge for Android**: ✅ Supported

### iOS (⚠️ Limited Support)
- **Safari on iOS**: ❌ **NOT SUPPORTED** (iOS Safari does not support Web Push API)
- **Chrome on iOS**: ❌ **NOT SUPPORTED** (uses Safari engine, same limitation)
- **Firefox on iOS**: ❌ **NOT SUPPORTED** (uses Safari engine, same limitation)

**Note**: iOS requires a native app for push notifications. Web push notifications are not available on iOS browsers.

## 📱 Testing on Mobile Devices

### Prerequisites

1. **HTTPS Required**: Push notifications require HTTPS (or localhost). Your Cloudflare tunnel provides HTTPS automatically.

2. **Service Worker**: The service worker must be registered and active.

3. **Notification Permission**: Browser must have permission to show notifications.

### Step-by-Step Testing on Android

1. **Get the Shareable Link**:
   ```bash
   npx --yes cloudflared tunnel --url http://localhost:3000
   ```
   Copy the HTTPS URL (e.g., `https://xxxxx.trycloudflare.com`)

2. **Open on Android Phone**:
   - Open Chrome browser on your Android phone
   - Navigate to the HTTPS URL
   - Log in to your account

3. **Enable Notifications**:
   - Go to **Profile** → **Settings**
   - Scroll to **Notifications** section
   - Toggle **Browser Notifications** ON
   - Grant permission when prompted

4. **Test Notification**:
   - Click **"Send Test Notification"** button
   - A notification should appear in your phone's notification bar
   - The notification will show even if the browser is closed (if service worker is active)

5. **Verify Service Worker**:
   - Open Chrome DevTools (connect via USB debugging or use Chrome Remote Debugging)
   - Go to **Application** → **Service Workers**
   - Verify `sw.js` is registered and active

### Mobile-Specific Features

The service worker includes mobile optimizations:

- ✅ **Vibration**: Notifications vibrate on mobile devices
- ✅ **Sound**: Notifications play sound (if device is not on silent)
- ✅ **Badge**: App icon badge shows notification count
- ✅ **Persistent**: Notifications appear even when browser is closed
- ✅ **Clickable**: Tapping notification opens the app

## 🔧 Troubleshooting Mobile Issues

### Issue: Notifications not appearing on Android

**Solutions**:

1. **Check HTTPS**:
   - Ensure you're using the HTTPS tunnel URL, not HTTP
   - Mobile browsers require HTTPS for push notifications

2. **Check Service Worker**:
   - Open Chrome on Android
   - Go to `chrome://serviceworker-internals/`
   - Verify your site's service worker is registered

3. **Check Permissions**:
   - Android Settings → Apps → Chrome → Notifications
   - Ensure notifications are enabled for Chrome
   - Check site-specific permissions in Chrome settings

4. **Clear Cache**:
   - Chrome → Settings → Privacy → Clear browsing data
   - Select "Cached images and files"
   - Reload the page

5. **Re-register Service Worker**:
   - Unregister service worker in Chrome DevTools
   - Refresh the page
   - Re-enable notifications in Profile Settings

### Issue: Notifications work on desktop but not mobile

**Possible Causes**:

1. **Different Browser**: Desktop and mobile might use different browsers
2. **Service Worker Not Active**: Mobile service worker might not be active
3. **Permission Denied**: Mobile browser might have denied permission
4. **HTTPS Issue**: Mobile might be using HTTP instead of HTTPS

**Solutions**:

1. Use the same browser on both devices (Chrome)
2. Check service worker status on mobile
3. Re-grant notification permission on mobile
4. Ensure mobile is using HTTPS URL

### Issue: iOS Notifications Not Working

**Explanation**: iOS Safari does not support Web Push API. This is a platform limitation, not a bug.

**Alternatives for iOS**:

1. **Native App**: Develop a native iOS app using Swift/Objective-C
2. **PWA**: Create a Progressive Web App (PWA) - but still no push notifications
3. **Email Notifications**: Use email reminders instead (already implemented)
4. **SMS Notifications**: Implement SMS reminders (future feature)

## 📊 Testing Checklist

### Android Testing

- [ ] App opens on Android Chrome
- [ ] Service worker registers successfully
- [ ] Notification permission is granted
- [ ] "Send Test Notification" button works
- [ ] Notification appears in notification bar
- [ ] Notification appears when browser is closed
- [ ] Tapping notification opens the app
- [ ] Notification vibrates device
- [ ] Notification plays sound (if not silent)

### iOS Testing

- [ ] App opens on iOS Safari
- [ ] Service worker registers (but push won't work)
- [ ] Notification permission cannot be granted (expected)
- [ ] Email notifications work as fallback

## 🚀 Best Practices for Mobile

1. **Always Use HTTPS**: Required for push notifications on mobile
2. **Request Permission Early**: Ask for notification permission after user logs in
3. **Explain Benefits**: Tell users why notifications are useful (medication reminders)
4. **Handle Denials Gracefully**: Provide email fallback if notifications are denied
5. **Test on Real Devices**: Always test on actual mobile devices, not just emulators

## 📝 Mobile-Specific Code Features

The service worker (`sw.js`) includes:

```javascript
// Mobile-optimized notification options
{
  vibrate: [200, 100, 200],  // Vibration pattern
  silent: false,              // Ensure sound plays
  renotify: true,            // Re-notify in notification bar
  dir: "ltr",                // Text direction
  lang: "en",                // Language
}
```

These options ensure notifications work optimally on mobile devices.

## 🔗 Resources

- [Web Push API Browser Support](https://caniuse.com/web-push)
- [Chrome Push Notifications Guide](https://developers.google.com/web/fundamentals/push-notifications)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

