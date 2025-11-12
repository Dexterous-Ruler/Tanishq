# 🏥 Nearby Clinics Setup Guide

## Overview

The Nearby Clinics feature shows hospitals, clinics, and medical facilities near the user's location. **No environment variables are required** - it uses the free OpenStreetMap API.

## How It Works

1. **Location Permission**: The app requests your browser's location permission
2. **Location Capture**: Once granted, it gets your current coordinates (latitude/longitude)
3. **Clinic Search**: It searches OpenStreetMap for nearby medical facilities
4. **Display**: Shows up to 10 clinics within 100km, sorted by distance

## Environment Variables

### ❌ **NOT REQUIRED** (Optional Only)

The clinics feature works **without any environment variables**. However, if you want better results, you can optionally add:

```
GOOGLE_PLACES_API_KEY
```
- **Optional**: Google Places API key for more accurate results
- **Note**: Requires billing enabled on Google Cloud
- **Fallback**: If not set, uses OpenStreetMap (free, no API key needed)

### ✅ **No Variables Needed**

The app will automatically use OpenStreetMap Nominatim API, which is:
- ✅ Free (no API key required)
- ✅ No billing needed
- ✅ Works worldwide
- ✅ No rate limits for reasonable use

## Troubleshooting

### Issue: "No clinics found nearby"

**Possible Causes:**
1. **Location permission not granted**
   - Check browser settings → Privacy → Location
   - Make sure location access is allowed for your site
   - Try clicking "Enable Location" button

2. **Location not captured**
   - Check browser console for location errors
   - Make sure GPS/location services are enabled on your device
   - Try refreshing the page and allowing location again

3. **No clinics in your area**
   - OpenStreetMap might not have medical facilities in your exact location
   - Try a different location or expand the search radius

4. **Network/CORS issues**
   - Check browser console for network errors
   - OpenStreetMap API should work from any domain
   - If blocked, check browser extensions or firewall

### Issue: "Location access required"

**Solution:**
1. Click the "Enable Location" button
2. Allow location access when browser prompts
3. If no prompt appears:
   - Check browser settings → Privacy → Location
   - Make sure location is enabled for your site
   - Try a different browser

### Issue: "Location permission denied"

**Solution:**
1. **Chrome/Edge**: 
   - Click the lock icon in address bar
   - Set Location to "Allow"
   - Refresh the page

2. **Firefox**:
   - Click the shield icon in address bar
   - Set Location to "Allow"
   - Refresh the page

3. **Safari**:
   - Safari → Preferences → Websites → Location Services
   - Set your site to "Allow"
   - Refresh the page

### Issue: Clinics not loading

**Debug Steps:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for logs starting with `[useLocation]`, `[useClinics]`, or `[Home]`
4. Check Network tab for `/api/clinics/nearby` requests
5. Verify the request has `lat` and `lng` parameters

## Testing

### Test Location Permission
1. Open the app
2. Go to Home page
3. Check browser console for `[useLocation] Requesting location permission...`
4. Allow location when prompted
5. Check console for `[useLocation] Location obtained: {latitude, longitude}`

### Test Clinics API
1. After location is obtained, check console for `[useClinics] Fetching clinics...`
2. Check Network tab for request to `/api/clinics/nearby?lat=...&lng=...&radius=100000`
3. Verify response has `success: true` and `clinics: [...]` array

### Manual Test
You can test the API directly:
```
GET /api/clinics/nearby?lat=28.6139&lng=77.2090&radius=100000
```
(Replace with your coordinates)

## Expected Behavior

1. **On Page Load**:
   - Location permission prompt appears (if not already granted)
   - Location is captured automatically
   - Clinics are fetched and displayed

2. **If Permission Denied**:
   - Shows "Location access required" message
   - "Enable Location" button appears
   - Clicking button requests permission again

3. **If No Clinics Found**:
   - Shows "No clinics found nearby" message
   - "Try refreshing location" button appears
   - Clicking button requests location again

4. **If Clinics Found**:
   - Shows list of up to 10 clinics
   - Each clinic shows: name, distance, address
   - "Directions" button opens Google Maps

## Console Logs

The app logs helpful debug information:

```
[Home] Requesting user location for nearby clinics
[useLocation] Requesting location permission...
[useLocation] Location obtained: {latitude: 28.6139, longitude: 77.2090}
[useClinics] Location available: 28.6139, 77.2090
[useClinics] Fetching clinics for location: 28.6139, 77.2090 (radius: 100000m)
[useClinics] Clinics API response: {success: true, clinics: [...]}
[useClinics] Found 5 clinics
[Home] Clinics data: {success: true, clinics: [...]}
[Home] Nearby clinics count: 5
```

## Server-Side Logs

Check Railway logs for:
```
[Clinics] Using OpenStreetMap to find hospitals near 28.6139,77.2090
[Clinics] Found 5 hospitals/clinics using OpenStreetMap
```

## Summary

✅ **No environment variables needed** - works out of the box with OpenStreetMap
✅ **Location permission required** - user must allow location access
✅ **Automatic location request** - happens on home page load
✅ **Free and unlimited** - no API keys or billing required

If clinics still don't appear:
1. Check browser console for errors
2. Verify location permission is granted
3. Check Railway logs for API errors
4. Try manually requesting location via "Enable Location" button

