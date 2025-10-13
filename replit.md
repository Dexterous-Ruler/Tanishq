# MediLocker - Health Data Management Platform

## Overview

MediLocker is a responsive health data management web application designed to provide users with secure, encrypted control over their medical records. The platform prioritizes user privacy, accessibility, and a seamless multi-device experience.

**Business Vision & Market Potential:** To empower individuals with complete ownership and secure access to their health data, addressing growing concerns about data privacy and fragmented medical records.

**Key Capabilities:**
- **Secure Storage:** Encrypted medical record management.
- **Responsive Design:** Optimal viewing and interaction across mobile, tablet, PC, and TV screens.
- **Accessibility:** Multi-language support (English/Hindi) and a Guided Mode.
- **UI-First Development:** Focus on pixel-perfect UI implementation based on provided designs.

## User Preferences

- **Communication Style:** I prefer direct and concise communication.
- **Workflow:** I prefer an iterative and incremental development approach, focusing on one screen at a time.
- **Interaction:**
    - Implement exact UI from provided designs; do not redesign or improvise.
    - Create thin screen containers with stubbed handlers.
    - Expose routes for preview.
    - Add accessibility without changing visuals.
    - Use feature flags for controlled navigation and rollouts.
    - Test responsiveness across all defined breakpoints (mobile, tablet, desktop, TV).
    - Verify accessibility (ARIA, keyboard navigation).
    - Obtain user approval before implementing behavior or proceeding to the next screen.

## System Architecture

**UI/UX Decisions:**
-   **Design Approach:** UI-First Development, rendering exact UI from provided designs.
-   **Color Scheme:** Trust-oriented blue palette (Blue 600, gradients), gray for text hierarchy, functional red/green for status.
-   **Typography:** System font stack, scalable for accessibility (Guided Mode increases font size).
-   **Responsive Design:** Mobile-first approach, scaling to 4K displays with breakpoints for mobile (max 390px), tablet (768px+), desktop (1024px+), and large screens/TV (1280px+).
-   **Accessibility:** WCAG AA compliance, multi-language support (English/Hindi), and a Guided Mode.

**Technical Implementations:**
-   **Frontend:** React 18 with TypeScript, using Vite for development.
-   **Routing:** Wouter for lightweight client-side routing.
-   **Styling:** Tailwind CSS with a custom design system.
-   **Animations:** Framer Motion for smooth UI transitions.
-   **State Management:** React Query (TanStack Query v5).
-   **Iconography:** Lucide React.
-   **Feature Flagging:** Implemented via `client/src/config/featureFlags.ts` to control screen availability and authentication methods, ensuring progressive rollout.

**Feature Specifications:**
-   **Authentication Flow:** Phone number input with real-time validation (Indian format), OTP verification with resend timer and call options, ABHA ID/Email/Guest sign-in alternatives.
-   **Onboarding:** Multi-slide carousel introducing features like data ownership, offline-first capabilities, and settings.
-   **Home Dashboard:** Sticky header, quick action cards (Upload, AI Insights, Emergency, Medications), recent documents, AI health insights, nearby clinics/labs, and a fixed bottom navigation.
-   **Security:** End-to-end encryption messaging (UI), privacy-first design, planned ABHA ID integration, and secure vault implementation.

**System Design Choices:**
-   **Modular Structure:** `components`, `pages`, `config`, `lib` directories for clear separation of concerns.
-   **Progressive Enhancement:** Screens are built and integrated one by one, enabling a structured development and review process.
-   **In-memory storage (MemStorage)** for MVP, with future plans for a robust backend and persistent storage.

## External Dependencies

-   **React:** `react`, `react-dom`
-   **TypeScript:** `typescript`
-   **Build Tool:** `vite`
-   **UI & Animation:**
    -   `framer-motion`
    -   `lucide-react`
    -   `tailwindcss`
-   **Routing:** `wouter`
-   **State Management:** `@tanstack/react-query`
-   **Backend (Planned/Future Integration):**
    -   `express`
    -   `drizzle-orm`