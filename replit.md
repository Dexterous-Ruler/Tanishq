# MediLocker - Health Data Management Platform

## 📋 Project Overview

**MediLocker** is a responsive health data management webapp that gives users complete control over their medical records with encrypted, secure storage. Built with a UI-first approach using React, TypeScript, and Framer Motion.

## 🎯 Project Goals

- **Responsive Design**: Works seamlessly on mobile, tablet, PC, and TV screens
- **Accessibility**: Multi-language support (English/Hindi), Guided Mode for enhanced accessibility
- **Security**: End-to-end encryption messaging, privacy-first design
- **Progressive Implementation**: Incremental screen-by-screen development

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **Routing**: Wouter (lightweight client-side routing)
- **Styling**: Tailwind CSS, Custom design system
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **State**: React Query (TanStack Query v5)
- **Backend**: Express.js (future integration)
- **Storage**: In-memory (MemStorage) for MVP

### Design Approach
Following **UI-First Development**:
1. Render exact UI from provided designs (no redesign)
2. Create thin screen containers with stubbed handlers
3. Expose routes for preview
4. Add accessibility without changing visuals
5. Feature flags for controlled navigation

## 📁 Project Structure

```
medi-locker/
├── client/
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── ui/              # Shadcn components
│   │   │   └── MediLockerAuthPage.tsx
│   │   ├── pages/               # Screen containers
│   │   │   ├── auth.tsx         # ✅ Auth page (live)
│   │   │   ├── otp.tsx          # 🚧 Coming soon
│   │   │   ├── onboarding.tsx   # 🚧 Coming soon
│   │   │   ├── home.tsx         # 🚧 Coming soon
│   │   │   └── vault.tsx        # 🚧 Coming soon
│   │   ├── config/
│   │   │   └── featureFlags.ts  # Feature toggle system
│   │   ├── lib/                 # Utilities
│   │   └── App.tsx              # Main app with routing
│   └── index.html
├── server/
│   ├── routes.ts                # API endpoints (future)
│   └── storage.ts               # Data persistence layer
├── shared/
│   └── schema.ts                # Shared types/schemas
├── design_guidelines.md         # Design system rules
├── RESPONSIVE_GUIDE.md          # Responsive testing guide
└── replit.md                    # This file
```

## 🚀 Current Implementation Status

### ✅ Completed (Screen 1: Auth)
- **Auth Page Component** (`MediLockerAuthPage.tsx`)
  - Phone number input with +91 prefix
  - Real-time validation (Indian mobile format)
  - OTP flow → navigates to /otp
  - Alternative sign-in: ABHA ID, Email, Guest
  - Language switcher (English/Hindi)
  - Guided Mode toggle for accessibility
  - Privacy information sheet
  - Framer Motion animations
  - Full responsive design (mobile → TV)
  - ARIA labels and data-testid attributes

- **Screen Container** (`pages/auth.tsx`)
  - Feature-flag controlled handlers
  - Navigation to OTP screen when enabled
  - Clean separation of UI and logic

### ✅ Completed (Screen 2: OTP Verification)
- **OTP Verification Component** (`MediLockerOtpVerificationScreen.tsx`)
  - 6-digit OTP input with visual feedback
  - Auto-focus and numeric keyboard
  - Error state with animation (incorrect OTP)
  - Resend timer (28 seconds countdown)
  - Resend OTP button (enabled after timer)
  - Get a Call alternative
  - Change Number navigation back to auth
  - Language switcher (English/Hindi)
  - Guided Mode toggle
  - Framer Motion animations
  - Full responsive design (mobile → TV)
  - All data-testid attributes

- **Screen Container** (`pages/otp.tsx`)
  - Stubbed verification (accepts '123456')
  - Resend OTP handler
  - Get Call handler
  - Change Number → navigates back to auth
  - Back button → navigates to auth
  - Onboarding navigation (when enabled)
  - Privacy, Terms, Help handlers

- **Routing & Config**
  - Route: `/otp` now live
  - Feature flag: `screens.otp = true`
  - Auth screen navigates to OTP on success

### 🚧 Planned (Feature-Flagged)
- **Onboarding**: User preferences, ABHA setup
- **Home Dashboard**: Health records overview
- **Vault**: Secure document storage
- **Backend**: Real authentication APIs

## 🎨 Design System

See `design_guidelines.md` for comprehensive design rules.

### Key Principles
- **Trust & Security**: Shield iconography, blue color palette
- **Clean & Clinical**: White backgrounds, subtle elevations
- **Accessible**: WCAG AA compliance, guided mode
- **Responsive**: Mobile-first, scales to 4K displays

### Color Palette
- Primary: Blue 600 (#2563EB) - Trust, healthcare
- Gradients: Blue 500 → Blue 600 → Indigo 700
- Neutrals: Gray scale for text hierarchy
- Functional: Red 600 (errors), Green 600 (success)

### Typography
- Font: System stack (-apple-system, Segoe UI, Inter)
- Scale: 12px (caption) → 28px (hero)
- Guided Mode: +1-2 sizes for accessibility

### Responsive Breakpoints
- Mobile: base (390px max-width)
- Tablet: md (768px+)
- Desktop: lg (1024px+)
- TV/Large: xl (1280px+)

## 🧪 Testing & Validation

### Smoke Test Checklist
See `RESPONSIVE_GUIDE.md` for complete testing guide.

**Quick Tests:**
1. Open app in browser
2. Enter phone number: `9876543210`
3. Click "Continue with OTP"
4. Verify loading animation
5. Check alert dialog appears
6. Test language switch (EN ↔ हिं)
7. Toggle Guided Mode
8. Open Privacy sheet
9. Resize browser (mobile → desktop)

### Responsive Testing
- Chrome DevTools: Ctrl+Shift+M
- Test widths: 320px, 390px, 768px, 1024px, 1920px
- Verify: No horizontal scroll, readable text, touch targets ≥44px

## 🔧 Development Workflow

### Current Phase: Screen-by-Screen Implementation
1. **Receive screen design** (TSX code from user)
2. **Create component** exactly as provided (no redesign)
3. **Build screen container** with stubbed handlers
4. **Add route** and update feature flags
5. **Test responsiveness** across breakpoints
6. **Verify accessibility** (ARIA, keyboard nav)
7. **Get user approval** before implementing behavior

### Next Screen: OTP Verification
Will follow same pattern:
- Create `MediLockerOTPPage` component
- Add `pages/otp.tsx` container
- Route `/otp` with feature flag
- Test and validate

## 📦 Dependencies

### Core
- react: ^18.3.1
- react-dom: ^18.3.1
- typescript: ^5.6.3
- vite: ^6.0.11

### UI/Animation
- framer-motion: ^11.15.0
- lucide-react: ^0.468.0
- tailwindcss: ^4.0.14

### Routing/State
- wouter: ^3.3.5
- @tanstack/react-query: ^5.62.11

### Backend (Future)
- express: ^5.0.2
- drizzle-orm: ^0.38.5

## 🔐 Security Considerations

- **Privacy-First**: No data collection without consent
- **Encryption**: End-to-end encryption messaging (UI)
- **ABHA Integration**: Government health ID support (planned)
- **Secure Storage**: Future encrypted vault implementation

## 📝 Feature Flags

Located in `client/src/config/featureFlags.ts`:

```typescript
screens: {
  auth: true,        // ✅ Live
  otp: false,        // 🚧 Next
  onboarding: false,
  home: false,
  vault: false,
}
```

### How Feature Flags Work

**Routing Control:**
- `screens.*` flags control route availability
- Disabled screens return 404
- Routes conditionally rendered in App.tsx based on flags

**Auth Method Control:**
- `auth.*` flags control authentication method handlers
- Disabled methods: handler undefined, button non-functional
- Enabled methods: handler executes, shows alert or navigates

**Important Notes:**
1. **Reload Required**: Flag changes need browser reload (compile-time flags)
2. **UI Preserved**: Buttons remain visible when disabled (per "exact UI" requirement)
3. **Progressive Rollout**: Enable screens/methods incrementally as implemented

See `FEATURE_FLAGS_TEST.md` for comprehensive testing guide.

## 🎯 Success Criteria

### Screen 1 (Auth) - ✅ Complete
- [x] Exact UI match from provided design
- [x] Responsive across all screen types
- [x] Accessibility attributes added
- [x] Animations smooth and performant
- [x] Language switching works
- [x] Guided mode functional
- [x] All interactions stubbed properly
- [x] No console warnings
- [x] Feature flags in place
- [x] Navigation to OTP screen working

### Screen 2 (OTP) - ✅ Complete
- [x] Exact UI match from provided design
- [x] 6-digit OTP input with visual feedback
- [x] Error state with animations
- [x] Resend timer (28s countdown) working
- [x] Language switching (EN ↔ HI) works
- [x] Guided mode functional
- [x] All navigation working (back, change number)
- [x] Responsive across all screen types
- [x] All interactions tested and verified
- [x] No console errors

### Next Milestones
- [ ] Onboarding screen implementation
- [ ] Home dashboard
- [ ] Secure vault with encryption
- [ ] Backend authentication integration
- [ ] ABHA ID flow

### Future Enhancements (Post-MVP)
- [ ] Pass real phone number from Auth to OTP (location state)
- [ ] Replace stub alerts with proper UI screens
- [ ] Backend OTP verification API integration
- [ ] SMS/Call service integration

## 🚀 How to Run

```bash
# Install dependencies (already done)
npm install

# Start development server
npm run dev

# Access app
http://localhost:5000
```

The app will automatically open on the Auth page.

## 📚 Additional Resources

- **Design Guidelines**: `design_guidelines.md`
- **Responsive Guide**: `RESPONSIVE_GUIDE.md`
- **Shadcn Components**: `client/src/components/ui/`
- **Feature Flags**: `client/src/config/featureFlags.ts`

## 🤝 Development Principles

1. **UI-First**: Implement exact designs, no improvisation
2. **Incremental**: One screen at a time with approval gates
3. **Responsive**: Test on all device sizes
4. **Accessible**: WCAG compliance from the start
5. **Feature-Flagged**: Safe, controlled feature rollout
6. **Well-Documented**: Clear code, comprehensive guides

---

**Last Updated**: Initial Auth screen implementation
**Current Phase**: Awaiting user approval for Screen 1
**Next Screen**: OTP Verification (pending)
