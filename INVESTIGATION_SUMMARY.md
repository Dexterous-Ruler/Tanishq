# 🔍 Session Issue Investigation Summary

## Problem
Sessions work perfectly locally but fail in production (Railway). Users are logged out immediately after OTP verification.

## Root Cause Analysis

### ✅ What Works Locally:
1. **HTTP Protocol** → `secure: false` cookies work
2. **No Proxy** → Direct connection, no proxy issues  
3. **MemoryStore** → Works fine for single-server dev
4. **Instant Cookie Processing** → No network delays
5. **Same Origin** → Frontend/backend on same port

### ❌ What Fails in Production:
1. **HTTPS Protocol** → Requires `secure: true` cookies
2. **Railway Proxy** → Express might not detect HTTPS correctly
3. **Cookie Race Condition** → Frontend checks status before cookie processed
4. **Session Store** → MemoryStore loses sessions on restart
5. **Network Delays** → Small delays cause timing issues

## Key Differences: Local vs Production

| Aspect | Local (Development) | Production (Railway) |
|--------|---------------------|----------------------|
| Protocol | HTTP | HTTPS |
| Cookie Secure | `false` | `true` |
| Proxy | None | Railway Load Balancer |
| Session Store | MemoryStore | PostgreSQL (if configured) |
| Cookie Processing | Instant | Small delays |
| Server Restarts | Manual | Automatic (deployments) |

## Critical Issues Identified

### Issue 1: Cookie Not Being Set ⚠️
**Symptom**: `Set-Cookie` header missing in response
**Cause**: 
- `secure: true` but Express thinks it's HTTP
- Railway proxy not forwarding `X-Forwarded-Proto` correctly
- Session not saved before response sent

### Issue 2: Cookie Not Being Sent ⚠️
**Symptom**: `Cookie` header missing in next request
**Cause**:
- Cookie blocked by browser (secure flag mismatch)
- Cookie domain/path mismatch
- Cookie not processed by browser yet (race condition)

### Issue 3: Session Not Loaded ⚠️
**Symptom**: `req.session.token` is undefined
**Cause**:
- Cookie not sent, so session not loaded from store
- Session store (MemoryStore) cleared on restart
- Session ID in cookie doesn't match session in store

### Issue 4: Race Condition ⚠️
**Symptom**: Frontend checks auth status before cookie is processed
**Cause**:
- Frontend calls `getAuthStatus()` immediately after OTP verification
- Browser hasn't processed `Set-Cookie` header yet
- Cookie not available in next request

## Fixes Implemented

### ✅ Fix 1: Protocol Detection Debugging
- Added logging to detect protocol (HTTP vs HTTPS)
- Logs `X-Forwarded-Proto` header from Railway
- Helps identify if proxy is working correctly

### ✅ Fix 2: Enhanced Cookie Debugging
- Logs cookie flags (Secure, HttpOnly, SameSite)
- Logs cookie value (first 150 chars)
- Identifies if cookie is missing or malformed

### ✅ Fix 3: Removed Redundant Session Save
- Session saved once in `createUserSession`
- Removed duplicate save in route handler
- Prevents timing issues and race conditions

### ✅ Fix 4: Frontend Retry Logic
- Added 100ms delay before first auth status check
- Retries after 200ms if first check fails
- Handles cookie race conditions gracefully

### ✅ Fix 5: Enhanced Auth Status Logging
- Logs session ID, token, userId
- Logs cookie header
- Logs protocol and secure flags
- Helps identify where session is lost

### ✅ Fix 6: PostgreSQL Session Store
- Sessions stored in PostgreSQL (persistent)
- Sessions survive server restarts
- Automatic table creation
- Automatic session cleanup

## Expected Log Output

### On OTP Verification (Success):
```
[Auth] ========== STARTING SESSION CREATION ==========
[SessionService] ========== createUserSession CALLED ==========
[SessionService] Saving session to storage...
[SessionService] ✅ Session saved to storage
[SessionService] Saving express-session (async)...
[SessionService] ✅ Express session saved successfully
[Auth] ✅ Session verified in storage
[Protocol Debug] X-Forwarded-Proto: https
[Protocol Debug] Determined secure: true
[Cookie Debug] /api/auth/otp/verify - Set-Cookie: present
[Cookie Debug] Cookie flags: Secure=true, HttpOnly=true, SameSite=Lax
```

### On Auth Status Check (Success):
```
[Auth Status] ========== AUTH STATUS CHECK ==========
[Auth Status] Cookies received: yes
[Auth Status] Session token: abc12345...
[Auth Status] User authenticated: xxx-xxx-xxx
```

### On Auth Status Check (Failure):
```
[Auth Status] ========== AUTH STATUS CHECK ==========
[Auth Status] Cookies received: no
[Auth Status] ❌ No session token found in req.session
[Auth Status] This means the cookie wasn't sent or session wasn't loaded from store
```

## Next Steps

### Step 1: Verify Environment Variables
Check Railway → Variables:
- [ ] `DATABASE_URL` - Supabase PostgreSQL connection string
- [ ] `USE_DATABASE=true` - Enable database storage
- [ ] `SESSION_SECRET` - Session secret key
- [ ] `NODE_ENV=production` - Production mode

### Step 2: Deploy and Check Logs
1. Wait for Railway to deploy (automatic)
2. Check Railway logs for debugging output
3. Look for protocol detection logs
4. Look for cookie debugging logs
5. Look for session creation logs

### Step 3: Test Login Flow
1. Clear browser cookies
2. Login with OTP
3. Check Railway logs for session creation
4. Check browser DevTools for cookie
5. Verify auth status returns `true`

### Step 4: Analyze Logs
Based on logs, identify the exact failure point:
- **If "Set-Cookie: missing"** → Cookie not being set
- **If "Cookies received: no"** → Cookie not being sent
- **If "No session token found"** → Session not loaded
- **If "Session not found in storage"** → Session not saved

## Troubleshooting Guide

See `SESSION_DEBUGGING_GUIDE.md` for detailed troubleshooting steps.

## Most Likely Issues

Based on the investigation, the most likely issues are:

1. **DATABASE_URL not set** → Using MemoryStore (sessions lost on restart)
2. **Cookie not being set** → Protocol detection issue (Express thinks HTTP)
3. **Cookie not being sent** → Browser blocking cookie (secure flag mismatch)
4. **Race condition** → Frontend checks status before cookie processed

## Solution Priority

1. **HIGH**: Set `DATABASE_URL` and `USE_DATABASE=true` in Railway
2. **HIGH**: Verify protocol detection in logs (should show HTTPS)
3. **MEDIUM**: Check cookie is being set (check logs)
4. **MEDIUM**: Check cookie is being sent (check browser DevTools)
5. **LOW**: Retry logic handles race conditions

## Expected Resolution

After implementing all fixes and setting environment variables:

1. ✅ Sessions stored in PostgreSQL (persistent)
2. ✅ Cookies set correctly with Secure flag
3. ✅ Cookies sent with every request
4. ✅ Sessions loaded from store correctly
5. ✅ Auth status returns `true` after login
6. ✅ Users stay logged in across restarts

---

**Status**: ✅ Fixes implemented, debugging added
**Next**: Set `DATABASE_URL` and `USE_DATABASE=true`, then check logs

