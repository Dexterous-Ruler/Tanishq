# Feature Flags Testing Guide

## 🎯 Purpose

This guide verifies that the feature flag system correctly controls routing and authentication method availability.

## ⚠️ Important: Reload Required

**Feature flag changes require a browser reload to take effect.** This is standard behavior for compile-time feature flags.

After changing any flag in `client/src/config/featureFlags.ts`:
1. Save the file
2. **Reload the browser** (Ctrl+R / Cmd+R or hard reload Ctrl+Shift+R)
3. Vite will rebuild and apply changes

## 📋 Feature Flag Configuration

Located in `client/src/config/featureFlags.ts`

## 🧪 Test Scenarios

### Test 1: Auth Screen Availability

#### Current State (screens.auth = true)
- [ ] Navigate to `/` → Auth page loads
- [ ] Navigate to `/auth` → Auth page loads
- [ ] All auth buttons visible and functional

#### Test: Disable Auth Screen (screens.auth = false)
1. Edit `client/src/config/featureFlags.ts`
2. Set `screens.auth: false`
3. Save file and refresh browser
4. Expected Results:
   - [ ] Navigate to `/` → 404 Not Found page
   - [ ] Navigate to `/auth` → 404 Not Found page
   - [ ] Auth page completely inaccessible

#### Restore
- [ ] Set `screens.auth: true` 
- [ ] Verify auth page works again

---

### Test 2: Phone OTP Authentication

#### Current State (auth.phoneOTP = true)
- [ ] Enter valid phone: `9876543210`
- [ ] Click "Continue with OTP"
- [ ] Alert shows: "OTP will be sent to 9876543210"
- [ ] Console logs: "📱 Continue with OTP for phone: 9876543210"

#### Test: Disable Phone OTP (auth.phoneOTP = false)
1. Edit `client/src/config/featureFlags.ts`
2. Set `auth.phoneOTP: false`
3. Save and refresh
4. Expected Results:
   - [ ] Enter valid phone: `9876543210`
   - [ ] Click "Continue with OTP" → **NO ACTION** (handler undefined)
   - [ ] Button still visible but non-functional
   - [ ] No console log
   - [ ] No alert

#### Restore
- [ ] Set `auth.phoneOTP: true`
- [ ] Verify OTP flow works again

---

### Test 3: ABHA ID Authentication

#### Current State (auth.abhaId = true)
- [ ] Click "Use ABHA ID" button
- [ ] Alert shows: "ABHA ID authentication (ABHA screen coming soon)"
- [ ] Console logs: "🏥 Continue with ABHA ID"

#### Test: Disable ABHA (auth.abhaId = false)
1. Edit `client/src/config/featureFlags.ts`
2. Set `auth.abhaId: false`
3. Save and refresh
4. Expected Results:
   - [ ] Click "Use ABHA ID" → **NO ACTION**
   - [ ] Button still visible but non-functional
   - [ ] No console log
   - [ ] No alert

#### Restore
- [ ] Set `auth.abhaId: true`
- [ ] Verify ABHA works again

---

### Test 4: Guest Mode

#### Current State (auth.guest = true)
- [ ] Click "Continue as guest" button
- [ ] Alert shows: "Guest mode (Guest flow coming soon)"
- [ ] Console logs: "👤 Continue as guest"

#### Test: Disable Guest Mode (auth.guest = false)
1. Edit `client/src/config/featureFlags.ts`
2. Set `auth.guest: false`
3. Save and refresh
4. Expected Results:
   - [ ] Click "Continue as guest" → **NO ACTION**
   - [ ] Button visible but non-functional
   - [ ] No console log
   - [ ] No alert

#### Restore
- [ ] Set `auth.guest: true`
- [ ] Verify guest mode works again

---

### Test 5: Email Authentication

#### Current State (auth.email = true)
- [ ] Click "Continue with Email" button
- [ ] Alert shows: "Email authentication (Email screen coming soon)"
- [ ] Console logs: "📧 Continue with email"

#### Test: Disable Email Auth (auth.email = false)
1. Edit `client/src/config/featureFlags.ts`
2. Set `auth.email: false`
3. Save and refresh
4. Expected Results:
   - [ ] Click email button → **NO ACTION**
   - [ ] Button visible but non-functional
   - [ ] No console log
   - [ ] No alert

#### Restore
- [ ] Set `auth.email: true`
- [ ] Verify email auth works again

---

### Test 6: Future Screen Navigation (OTP)

#### Current State (screens.otp = false)
- [ ] Enter phone: `9876543210`
- [ ] Click "Continue with OTP"
- [ ] Alert shows: "(OTP screen coming soon)"
- [ ] User stays on auth page

#### Test: Enable OTP Screen (screens.otp = true)
1. Create placeholder OTP page: `client/src/pages/otp.tsx`:
```tsx
export default function OTPPage() {
  return <div>OTP Screen Placeholder</div>;
}
```

2. Update `client/src/App.tsx` uncomment OTP route:
```tsx
import OTPPage from "@/pages/otp";
// ... in Router:
{featureFlags.screens.otp && <Route path="/otp" component={OTPPage} />}
```

3. Edit `client/src/config/featureFlags.ts`
4. Set `screens.otp: true`
5. Save and refresh
6. Expected Results:
   - [ ] Enter phone: `9876543210`
   - [ ] Click "Continue with OTP"
   - [ ] **Navigates to `/otp`** (shows OTP placeholder)
   - [ ] Console logs: "📱 Continue with OTP for phone: 9876543210"
   - [ ] No alert (navigation happens instead)

#### Restore
- [ ] Set `screens.otp: false`
- [ ] Remove OTP page import
- [ ] Comment out OTP route

---

### Test 7: Multi-Language Feature

#### Current State (features.multiLanguage = true)
- [ ] Language toggle button visible
- [ ] Click toggle → Dropdown appears
- [ ] Switch EN ↔ हिं works

#### Test: Disable Multi-Language (features.multiLanguage = false)
**Note:** This feature is not currently gated in the UI. This test documents future implementation.

Expected behavior if implemented:
- Language toggle would be hidden
- App would default to English only

---

### Test 8: Guided Mode Feature

#### Current State (features.guidedMode = true)
- [ ] Guided Mode button visible
- [ ] Click toggles larger text/UI

#### Test: Disable Guided Mode (features.guidedMode = false)
**Note:** This feature is not currently gated in the UI. This test documents future implementation.

Expected behavior if implemented:
- Guided Mode button would be hidden
- App would use normal size only

---

## 🔄 Combination Tests

### Test 9: Disable All Auth Methods
1. Set all to false:
```typescript
auth: {
  phoneOTP: false,
  abhaId: false,
  email: false,
  guest: false,
}
```

2. Expected Results:
   - [ ] All buttons visible but non-functional
   - [ ] No handlers execute
   - [ ] User cannot proceed
   - [ ] Auth screen effectively locked

### Test 10: Progressive Rollout Simulation
Simulate gradual feature rollout:

1. **Phase 1: Phone OTP only**
```typescript
auth: {
  phoneOTP: true,
  abhaId: false,
  email: false,
  guest: false,
}
```
- [ ] Only OTP works
- [ ] Other methods disabled

2. **Phase 2: Add ABHA**
```typescript
auth: {
  phoneOTP: true,
  abhaId: true,
  email: false,
  guest: false,
}
```
- [ ] OTP and ABHA work
- [ ] Email and guest still disabled

3. **Phase 3: Full rollout**
```typescript
auth: {
  phoneOTP: true,
  abhaId: true,
  email: true,
  guest: true,
}
```
- [ ] All methods work

---

## ✅ Verification Checklist

After all tests:
- [ ] Feature flags correctly gate routing
- [ ] Disabled screens show 404
- [ ] Enabled screens are accessible
- [ ] Auth method flags control handlers
- [ ] Disabled handlers don't execute
- [ ] Console logs only appear when enabled
- [ ] Navigation works when target screen enabled
- [ ] Alerts show when target screen disabled
- [ ] No errors in console during flag changes
- [ ] No TypeScript errors
- [ ] App remains stable with any flag combination

---

## 🚨 Known Limitations

1. **UI Still Visible**: Disabled auth method buttons still appear in the UI. They're just non-functional. This is by design to preserve the exact UI layout.

2. **No Visual Indication**: Users can't tell if a button is disabled by feature flag (it looks normal but doesn't work). Future enhancement: Show disabled state or hide button.

3. **Future Features Not Gated**: `multiLanguage` and `guidedMode` flags exist but don't currently control UI visibility. They're placeholders for future implementation.

---

## 📝 Test Report Template

**Date**: __________  
**Tester**: __________  
**Branch/Commit**: __________  

| Test | Feature Flag | Expected | Actual | Pass/Fail |
|------|--------------|----------|--------|-----------|
| 1    | screens.auth = false | 404 page | | ⬜ |
| 2    | auth.phoneOTP = false | No OTP | | ⬜ |
| 3    | auth.abhaId = false | No ABHA | | ⬜ |
| 4    | auth.guest = false | No guest | | ⬜ |
| 5    | auth.email = false | No email | | ⬜ |
| 6    | screens.otp = true | Navigate to /otp | | ⬜ |
| 9    | All auth = false | All locked | | ⬜ |
| 10   | Progressive rollout | Gradual enable | | ⬜ |

**Overall Result**: ⬜ Pass  ⬜ Fail  
**Notes**: __________
