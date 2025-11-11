# 🔍 Session Debugging Guide - Local vs Production

## Problem Statement

Sessions work perfectly locally but fail in production (Railway). Users are logged out immediately after OTP verification.

## Root Cause Analysis

### Why It Works Locally:
1. **HTTP Protocol**: Local development uses HTTP, `secure: false` cookies work
2. **No Proxy**: Direct connection, no proxy issues
3. **Same Origin**: Frontend and backend on same port (localhost:3000)
4. **MemoryStore**: Works fine for single-server development
5. **No Network Delays**: Instant cookie processing

### Why It Fails in Production (Railway):
1. **HTTPS Protocol**: Railway uses HTTPS, requires `secure: true` cookies
2. **Proxy/Load Balancer**: Railway uses a proxy, Express might not detect HTTPS correctly
3. **Cookie Race Condition**: Frontend checks auth status before cookie is processed
4. **Session Store**: If using MemoryStore, sessions are lost on restart
5. **Network Delays**: Small delays in cookie processing can cause race conditions

## Investigation Steps

### Step 1: Check Railway Logs

After deployment, check Railway logs for these messages:

#### ✅ Success Indicators:
```
✅ Using PostgreSQL session store (Supabase) - Sessions will persist across restarts
✅ PostgreSQL session store connection verified
[Protocol Debug] X-Forwarded-Proto: https
[Protocol Debug] Determined secure: true
[Cookie Debug] /api/auth/otp/verify - Set-Cookie: present
[Cookie Debug] Cookie flags: Secure=true, HttpOnly=true, SameSite=Lax
[Auth Status] Session token: abc12345...
[Auth Status] User authenticated: xxx-xxx-xxx
```

#### ❌ Failure Indicators:
```
⚠️  WARNING: DATABASE_URL not set - Using MemoryStore
[Protocol Debug] X-Forwarded-Proto: not set
[Protocol Debug] Determined secure: false
[Cookie Debug] /api/auth/otp/verify - Set-Cookie: missing
[Auth Status] No session token found in req.session
[Auth Status] Cookies received: no
```

### Step 2: Check Browser DevTools

1. **Open DevTools** → **Application** → **Cookies**
2. **Look for**: `arogya_vault_session` cookie
3. **Check cookie properties**:
   - **Domain**: Should match your Railway domain
   - **Path**: Should be `/`
   - **Secure**: Should be checked (HTTPS only)
   - **HttpOnly**: Should be checked
   - **SameSite**: Should be `Lax`

4. **Network Tab**:
   - **Request to `/api/auth/otp/verify`**:
     - Check **Response Headers** → `Set-Cookie` header should be present
     - Check cookie value and flags
   - **Request to `/api/auth/status`**:
     - Check **Request Headers** → `Cookie` header should be present
     - Check if cookie value matches

### Step 3: Verify Environment Variables

Check Railway → Variables → Verify these are set:

**Required:**
- `DATABASE_URL` - Supabase PostgreSQL connection string
- `USE_DATABASE=true` - Enable database storage
- `SESSION_SECRET` - Session secret key
- `NODE_ENV=production` - Production mode

**Optional but Recommended:**
- `TRUST_PROXY=true` - Trust Railway's proxy (default: true)

### Step 4: Check Protocol Detection

Railway logs should show:
```
[Protocol Debug] req.protocol: https
[Protocol Debug] req.secure: true
[Protocol Debug] X-Forwarded-Proto: https
[Protocol Debug] Determined secure: true
```

If you see:
```
[Protocol Debug] req.protocol: http
[Protocol Debug] req.secure: false
[Protocol Debug] X-Forwarded-Proto: not set
```

**This means**: Railway proxy isn't forwarding the protocol correctly, or `trust proxy` isn't working.

### Step 5: Check Cookie Setting

Railway logs should show:
```
[Cookie Debug] /api/auth/otp/verify - Set-Cookie: present
[Cookie Debug] Cookie: arogya_vault_session=s%3A...
[Cookie Debug] Cookie flags: Secure=true, HttpOnly=true, SameSite=Lax
```

If you see:
```
[Cookie Debug] /api/auth/otp/verify - Set-Cookie: missing
⚠️  NO SET-COOKIE HEADER - Cookie not being set!
```

**This means**: Cookie isn't being set, likely because:
1. `secure: true` but Express thinks it's HTTP
2. Session wasn't saved properly
3. Response sent before cookie was set

## Fixes Implemented

### Fix 1: Protocol Detection Debugging
- Added logging to detect protocol (HTTP vs HTTPS)
- Logs `X-Forwarded-Proto` header from Railway
- Helps identify if proxy is working correctly

### Fix 2: Enhanced Cookie Debugging
- Logs cookie flags (Secure, HttpOnly, SameSite)
- Logs cookie value (first 150 chars)
- Identifies if cookie is missing

### Fix 3: Removed Redundant Session Save
- Session is saved once in `createUserSession`
- Removed duplicate save in route handler
- Prevents timing issues

### Fix 4: Frontend Retry Logic
- Added 100ms delay before first auth status check
- Retries after 200ms if first check fails
- Handles cookie race conditions

### Fix 5: Enhanced Auth Status Logging
- Logs session ID, token, userId
- Logs cookie header
- Logs protocol and secure flags
- Helps identify where session is lost

## Expected Behavior After Fixes

### On OTP Verification:
1. Session created in PostgreSQL
2. Session data set in `req.session`
3. Cookie set in response (`Set-Cookie` header)
4. Response sent with success message

### On Auth Status Check:
1. Cookie sent in request (`Cookie` header)
2. Express-session loads session from PostgreSQL
3. `req.session.token` is available
4. Session validated in Supabase storage
5. User authenticated successfully

## Troubleshooting Checklist

- [ ] **DATABASE_URL is set** in Railway
- [ ] **USE_DATABASE=true** in Railway
- [ ] **SESSION_SECRET is set** in Railway
- [ ] **NODE_ENV=production** in Railway
- [ ] **PostgreSQL session store** initialized (check logs)
- [ ] **Cookie is set** in response (check logs)
- [ ] **Cookie is sent** in next request (check logs)
- [ ] **Protocol is detected** correctly (check logs)
- [ ] **Session is loaded** from store (check logs)
- [ ] **Browser has cookie** (check DevTools)

## Common Issues and Solutions

### Issue 1: "DATABASE_URL not set"
**Solution**: Add `DATABASE_URL` environment variable in Railway
- Get from: Supabase Dashboard → Settings → Database → Connection string (URI)

### Issue 2: "Set-Cookie: missing"
**Solution**: 
- Check if `secure: true` but Express thinks it's HTTP
- Check Railway logs for protocol detection
- Verify `trust proxy` is set correctly

### Issue 3: "Cookies received: no"
**Solution**:
- Check browser DevTools → Application → Cookies
- Verify cookie domain matches Railway domain
- Check if cookie is blocked by browser
- Verify `credentials: "include"` in frontend requests

### Issue 4: "Session not found in storage"
**Solution**:
- Check if session was saved to PostgreSQL
- Check if session expired
- Check if session ID matches cookie value

### Issue 5: "No session token found"
**Solution**:
- Check if cookie is being sent
- Check if session is loaded from store
- Check if session data is in `req.session`
- Verify session store is PostgreSQL (not MemoryStore)

## Next Steps

1. **Deploy the fixes** to Railway
2. **Check Railway logs** for debugging output
3. **Test login flow** and verify sessions persist
4. **Check browser DevTools** for cookie information
5. **Share logs** if issues persist for further debugging

## Debugging Commands

### Check Railway Logs:
```bash
# In Railway Dashboard → Deployments → Latest → View Logs
# Look for:
# - [Protocol Debug] messages
# - [Cookie Debug] messages
# - [Auth Status] messages
# - [SessionService] messages
```

### Check Browser Console:
```javascript
// In browser DevTools → Console
// Check cookies:
document.cookie

// Check if cookie is set:
document.cookie.includes('arogya_vault_session')
```

### Check Network Tab:
1. Open DevTools → Network
2. Filter by `/api/auth`
3. Check request/response headers
4. Verify `Set-Cookie` and `Cookie` headers

---

**Status**: ✅ Fixes implemented, ready for testing
**Next**: Deploy and check Railway logs for debugging output

