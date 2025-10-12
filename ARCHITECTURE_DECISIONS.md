# Feature Flags - Architecture Decisions & Trade-offs

## Current Implementation

### Compile-Time Feature Flags
The feature flags are implemented as **compile-time constants** that control:
1. Route registration in the router
2. Handler availability in components

### How It Works

**File**: `client/src/config/featureFlags.ts`
```typescript
export const featureFlags = {
  screens: { auth: true, otp: false, ... },
  auth: { phoneOTP: true, abhaId: true, ... }
}
```

**Router** (`App.tsx`):
```typescript
{featureFlags.screens.auth && <Route path="/" component={AuthPage} />}
```

**Handlers** (`pages/auth.tsx`):
```typescript
onContinueWithOTP={featureFlags.auth.phoneOTP ? handleContinueWithOTP : undefined}
```

### Behavior

1. **Flag enabled**: Route accessible, handler executes
2. **Flag disabled**: Route returns 404, handler undefined (button does nothing)
3. **Flag changes**: Require **browser reload** to take effect

## Design Constraints

### User Requirement: "Exact UI"
> "Do NOT redesign UI, add visuals, or invent functionality"
> "Place my component code as-is"

This constraint means:
- ✅ Buttons always visible in same positions
- ❌ Cannot hide buttons when disabled
- ❌ Cannot change button appearance (grayed out, etc.)
- ❌ Cannot add visual indicators for disabled state

**Result**: Disabled buttons are visually identical to enabled ones, but non-functional.

## Trade-offs & Alternatives

### Current Approach: Compile-Time Flags
**Pros:**
- ✅ Simple implementation
- ✅ No additional infrastructure needed
- ✅ Standard practice in React/Vite apps
- ✅ Meets user's "exact UI" requirement
- ✅ Effective for deployment control

**Cons:**
- ❌ Requires reload to see changes
- ❌ No visual feedback for disabled buttons
- ❌ Silent failures when buttons clicked but disabled

### Alternative 1: Runtime Feature Flags
**How**: Load flags from API/localStorage, use React Context
```typescript
const [flags, setFlags] = useState(loadFlags());
// Flags update without reload
```

**Pros:**
- ✅ Changes apply instantly
- ✅ Can toggle during testing
- ✅ A/B testing possible
- ✅ Remote flag control

**Cons:**
- ❌ More complex implementation
- ❌ Requires state management
- ❌ API/storage infrastructure needed
- ❌ Still can't show visual disabled state (UI constraint)
- ❌ Not requested by user

### Alternative 2: Visual Feedback
**How**: Gray out or hide buttons when handlers undefined
```typescript
disabled={!handler}
className={!handler ? 'opacity-50 cursor-not-allowed' : ''}
```

**Pros:**
- ✅ Clear disabled state
- ✅ Better UX
- ✅ No silent failures

**Cons:**
- ❌ **Violates "exact UI" requirement**
- ❌ Changes visual appearance
- ❌ Not what user asked for

### Alternative 3: Toast Notifications
**How**: Show toast when disabled button clicked
```typescript
onClick={() => toast("This feature is currently disabled")}
```

**Pros:**
- ✅ Feedback without changing UI
- ✅ Better UX

**Cons:**
- ❌ Adds new functionality (violates "no invent" rule)
- ❌ Requires modifying component
- ❌ Not requested by user

## Recommendations

### For MVP (Current Phase)
**Keep current implementation** because:
1. Meets user's stated requirements
2. Feature flags work for deployment control
3. Simple, maintainable code
4. Standard practice for static deployments

### For Production (Future)
Consider upgrading to runtime flags if:
1. A/B testing needed
2. Remote feature control desired
3. User approves UI changes for disabled states
4. Real-time flag updates required

**Implementation path**:
1. Create `FeatureFlagProvider` context
2. Load flags from API/localStorage
3. Wrap app in provider
4. Components read from context
5. Add UI to show/hide disabled features (if UI constraint relaxed)

## Testing Current Implementation

See `FEATURE_FLAGS_TEST.md` for complete test guide.

**Quick test:**
1. Edit `featureFlags.ts`, set `screens.auth: false`
2. Save file
3. **Reload browser** (Ctrl+R)
4. Navigate to `/` → See 404 page
5. Set `screens.auth: true`, reload → Auth page works

**Known limitation**: Silent failures when auth methods disabled. Buttons clickable but non-functional.

## Summary

The current feature flag implementation:
- ✅ **Works as intended** for deployment control
- ✅ **Preserves exact UI** as required
- ✅ **Controls routing** based on screen flags
- ✅ **Gates handlers** based on auth flags
- ⚠️ **Requires reload** for changes (standard for static apps)
- ⚠️ **No visual feedback** for disabled state (per UI constraint)

**This is a valid architecture given the constraints.** If different behavior is needed, user requirements must be updated to allow UI modifications or runtime flag infrastructure.

---

**Decision**: Proceed with current implementation for MVP. Revisit if user requests runtime flags or approves UI changes for disabled states.
