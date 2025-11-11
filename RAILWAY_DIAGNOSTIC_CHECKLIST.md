# 🔍 Railway Session Diagnostic Checklist

Use this checklist to diagnose session issues after deployment.

## Pre-Deployment Checklist

- [ ] `DATABASE_URL` is set in Railway (Supabase PostgreSQL connection string)
- [ ] `USE_DATABASE=true` is set in Railway
- [ ] `SESSION_SECRET` is set in Railway
- [ ] `NODE_ENV=production` is set in Railway
- [ ] Code is pushed to GitHub
- [ ] Railway has deployed the latest code

## Post-Deployment Checklist

### 1. Check Railway Logs - Server Startup

Look for these messages in Railway logs:

- [ ] `✅ Using PostgreSQL session store (Supabase)` - Session store initialized
- [ ] `✅ PostgreSQL session store connection verified` - Database connected
- [ ] `serving on port 3000` - Server started

**If you see:**
- `⚠️ WARNING: DATABASE_URL not set` → Add `DATABASE_URL` environment variable
- `⚠️ WARNING: USE_DATABASE is not 'true'` → Set `USE_DATABASE=true`
- `❌ Failed to initialize PostgreSQL session store` → Check `DATABASE_URL` format

### 2. Check Railway Logs - OTP Verification

When you login, look for these messages:

- [ ] `[Auth] ========== STARTING SESSION CREATION ==========`
- [ ] `[SessionService] ✅ Session saved to storage`
- [ ] `[SessionService] ✅ Express session saved successfully`
- [ ] `[Protocol Debug] X-Forwarded-Proto: https`
- [ ] `[Protocol Debug] Determined secure: true`
- [ ] `[Cookie Debug] /api/auth/otp/verify - Set-Cookie: present`
- [ ] `[Cookie Debug] Cookie flags: Secure=true, HttpOnly=true, SameSite=Lax`

**If you see:**
- `[Protocol Debug] X-Forwarded-Proto: not set` → Railway proxy issue
- `[Protocol Debug] Determined secure: false` → Protocol detection failed
- `[Cookie Debug] Set-Cookie: missing` → Cookie not being set
- `[Cookie Debug] Cookie flags: Secure=false` → Secure flag not set

### 3. Check Railway Logs - Auth Status Check

When frontend checks auth status, look for:

- [ ] `[Auth Status] Cookies received: yes`
- [ ] `[Auth Status] Session token: abc12345...`
- [ ] `[Auth Status] User authenticated: xxx-xxx-xxx`

**If you see:**
- `[Auth Status] Cookies received: no` → Cookie not being sent by browser
- `[Auth Status] No session token found` → Session not loaded from store
- `[Auth Status] Session not found in storage` → Session not saved or expired

### 4. Check Browser DevTools - Cookies

1. Open DevTools → Application → Cookies
2. Look for cookie: `arogya_vault_session`
3. Check cookie properties:
   - [ ] **Domain**: Matches Railway domain
   - [ ] **Path**: `/`
   - [ ] **Secure**: ✅ (checked)
   - [ ] **HttpOnly**: ✅ (checked)
   - [ ] **SameSite**: `Lax`

**If cookie is missing:**
- Cookie not being set (check Railway logs)
- Cookie blocked by browser
- Cookie domain/path mismatch

### 5. Check Browser DevTools - Network Tab

#### Request: `/api/auth/otp/verify`
- [ ] **Response Headers** → `Set-Cookie` header present
- [ ] **Set-Cookie** value contains `arogya_vault_session`
- [ ] **Set-Cookie** contains `Secure` flag
- [ ] **Set-Cookie** contains `HttpOnly` flag

#### Request: `/api/auth/status`
- [ ] **Request Headers** → `Cookie` header present
- [ ] **Cookie** value contains `arogya_vault_session=...`
- [ ] Cookie value matches session ID from previous request

**If Set-Cookie is missing:**
- Cookie not being set by server
- Check Railway logs for cookie debugging

**If Cookie header is missing:**
- Cookie not being sent by browser
- Check browser cookie settings
- Check if cookie is blocked

### 6. Check Browser Console

- [ ] No CORS errors
- [ ] No cookie-related errors
- [ ] No network errors

## Common Issues and Solutions

### Issue 1: "DATABASE_URL not set"
**Solution**: 
1. Go to Supabase Dashboard → Settings → Database
2. Copy Connection string (URI)
3. Add to Railway → Variables → `DATABASE_URL`
4. Set `USE_DATABASE=true`
5. Redeploy

### Issue 2: "Set-Cookie: missing"
**Possible Causes**:
1. Protocol detection failed (Express thinks HTTP)
2. Session not saved before response sent
3. Cookie configuration error

**Solution**:
1. Check Railway logs for protocol detection
2. Verify `X-Forwarded-Proto: https` in logs
3. Check if `trust proxy` is set
4. Verify `secure: true` in cookie config

### Issue 3: "Cookies received: no"
**Possible Causes**:
1. Cookie not set in previous request
2. Cookie blocked by browser
3. Cookie domain/path mismatch
4. Cookie expired immediately

**Solution**:
1. Check if cookie exists in browser DevTools
2. Check cookie domain matches Railway domain
3. Check cookie path is `/`
4. Check cookie expiration time

### Issue 4: "No session token found"
**Possible Causes**:
1. Cookie not sent, so session not loaded
2. Session not saved to store
3. Session ID mismatch

**Solution**:
1. Check if cookie is being sent (Network tab)
2. Check if session was saved (Railway logs)
3. Check session ID in cookie matches session in store

### Issue 5: "Session not found in storage"
**Possible Causes**:
1. Session not saved to PostgreSQL
2. Session expired
3. Session ID mismatch

**Solution**:
1. Check PostgreSQL connection (Railway logs)
2. Check if session table exists
3. Check session expiration time
4. Verify session was saved (Railway logs)

## Diagnostic Flow

```
1. Check Railway Logs (Server Startup)
   ↓
2. Check Railway Logs (OTP Verification)
   ↓
3. Check Browser DevTools (Cookies)
   ↓
4. Check Browser DevTools (Network Tab)
   ↓
5. Check Railway Logs (Auth Status)
   ↓
6. Identify Failure Point
   ↓
7. Apply Fix
```

## Expected Behavior

### Successful Flow:
1. User logs in → OTP verified
2. Session created → Saved to PostgreSQL
3. Cookie set → `Set-Cookie` header in response
4. Browser processes cookie → Stores in cookie jar
5. Frontend checks auth status → Cookie sent in request
6. Session loaded → From PostgreSQL via cookie
7. Auth status returns → `{authenticated: true}`

### Failed Flow (Common):
1. User logs in → OTP verified
2. Session created → Saved to PostgreSQL
3. Cookie NOT set → `Set-Cookie` header missing
4. Browser has no cookie → Cannot send cookie
5. Frontend checks auth status → No cookie in request
6. Session NOT loaded → `req.session` is empty
7. Auth status returns → `{authenticated: false}`

## Quick Test

1. **Clear browser cookies** for Railway domain
2. **Open DevTools** → Network tab
3. **Login with OTP**
4. **Check Network tab**:
   - Response from `/api/auth/otp/verify` → Should have `Set-Cookie`
   - Request to `/api/auth/status` → Should have `Cookie`
5. **Check Railway logs**:
   - Should see session creation logs
   - Should see cookie debugging logs
   - Should see auth status logs

## Next Steps

1. **Deploy latest code** (already done)
2. **Set environment variables** (`DATABASE_URL`, `USE_DATABASE=true`)
3. **Test login flow**
4. **Check Railway logs** for debugging output
5. **Share logs** if issues persist

---

**Status**: ✅ Diagnostic checklist ready
**Use this**: After deployment, follow checklist to identify issue

