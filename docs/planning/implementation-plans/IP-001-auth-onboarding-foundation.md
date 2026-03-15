# IP-001: Auth + Onboarding Foundation (Mock-first, Supabase-ready)

## Metadata
- Task ID: `T001`
- Owner: AI pair session with user
- Status: `implemented`
- Scope: Add authentication and onboarding UX foundation without wiring real backend yet; create clean integration seams for Supabase Auth and social logins.

## Objectives
- Introduce a robust auth domain model and UI flow in `carnitis`.
- Keep current app usable with dummy data while preparing backend-ready boundaries.
- Ensure accessibility and route architecture are ready for protected pages.
- Avoid lock-in so Google and additional providers can be added with minimal changes.

## Non-Goals (for this iteration)
- No live Supabase calls.
- No real OAuth provider credentials/config.
- No production-grade account management (email verification, password reset screens can be stubbed but not wired).

## Architecture Decisions
1. `AuthService` interface first; implementation starts with in-memory/mock adapter.
2. Server/client boundary by design:
   - auth-aware route wrapper components prepared for future server session checks,
   - client state limited to presentation and optimistic UX.
3. Route groups for auth and app separation:
   - `(auth)` for sign-in/up/onboarding,
   - `(app)` for protected product surfaces.
4. Explicit user/session types centralized in `lib/auth/types.ts`.
5. Provider model supports N providers (`google`, `github`, etc.) with one button component.

## Proposed File Tree (Phase 1)
```text
app/
  (auth)/
    sign-in/page.tsx
    sign-up/page.tsx
    onboarding/page.tsx
  (app)/
    layout.tsx
    page.tsx
components/
  auth/
    auth-layout.tsx
    auth-form.tsx
    social-login-buttons.tsx
    onboarding-form.tsx
    auth-guard.tsx
lib/
  auth/
    types.ts
    service.ts
    mock-auth-service.ts
    auth-context.tsx
    session.ts
```

## Step-by-Step Implementation Plan

### Step 1: Define auth contracts and domain types
- Create `lib/auth/types.ts`:
  - `AuthUser`, `AuthSession`, `AuthProvider`, `AuthResult`, `AuthErrorCode`.
- Create `lib/auth/service.ts` with `AuthService` interface:
  - `signInWithPassword`, `signUpWithPassword`, `signInWithOAuth`, `signOut`, `getSession`, `updateProfile`.
- Acceptance criteria:
  - No `any` types.
  - Types capture provider extensibility and error mapping.

### Step 2: Build mock auth service adapter
- Create `lib/auth/mock-auth-service.ts` implementing `AuthService`.
- Support deterministic behavior:
  - successful sign-in/up paths,
  - known failure states (invalid credentials, duplicate email),
  - mock session persistence via local storage key.
- Acceptance criteria:
  - Adapter can be swapped with future Supabase implementation by interface only.

### Step 3: Add auth context and session accessor
- Create `lib/auth/auth-context.tsx`:
  - `AuthProvider`, `useAuth` hook.
- Create `lib/auth/session.ts`:
  - utility helpers for bootstrapping and clearing session.
- Wire provider in root app layout with minimal re-render footprint.
- Acceptance criteria:
  - consumers can read `user`, `session`, `isLoading`, and auth actions.

### Step 4: Build accessible auth UI components
- Add `components/auth/auth-layout.tsx` for shared page shell and visual consistency.
- Add `components/auth/auth-form.tsx`:
  - labeled fields, proper input types/autocomplete attributes,
  - keyboard-first submission,
  - error region with `aria-live`.
- Add `components/auth/social-login-buttons.tsx`:
  - provider-driven rendering, includes Google CTA now (mock action).
- Acceptance criteria:
  - tab/shift-tab, enter submit, focus ring and error announcements work.

### Step 5: Introduce auth routes and onboarding route
- Add:
  - `app/(auth)/sign-in/page.tsx`
  - `app/(auth)/sign-up/page.tsx`
  - `app/(auth)/onboarding/page.tsx`
- Add `components/auth/onboarding-form.tsx`:
  - profile basics only (display name, default preferences).
- Acceptance criteria:
  - users can move through sign-in/up -> onboarding -> app root in mock mode.

### Step 6: Add protected app wrapper for current routes
- Add `components/auth/auth-guard.tsx`.
- Add `app/(app)/layout.tsx` as protected shell entry.
- Move current app pages under `(app)` route group (no URL changes).
- Acceptance criteria:
  - unauthenticated users are redirected to sign-in route.
  - authenticated users cannot access sign-in/up unless signed out.

### Step 7: Preserve social login integration seam
- In social buttons, call `signInWithOAuth(provider)` even in mock mode.
- Add clear TODO markers in adapter for future Supabase OAuth handoff.
- Acceptance criteria:
  - no UI refactor needed when swapping to Supabase provider APIs.

### Step 8: Validation and quality gates
- Run and record:
  - `npx tsc --noEmit`
  - `npm run build` (or document environment/network blocker)
- Manual QA checklist:
  - sign-up happy path,
  - sign-in error states,
  - sign-out behavior,
  - auth guard redirect,
  - mobile and desktop flow parity,
  - keyboard and screen reader basic checks.

## Supabase Migration Readiness Checklist
- `AuthService` methods map 1:1 with Supabase auth operations.
- Session object includes tokens/expiry fields expected by Supabase.
- Provider enum includes at least `google` and allows extension.
- No UI component directly imports mock implementation.
- Route guard can switch from client check to server check with minimal churn.

## Accessibility Checklist
- Every input has a visible label.
- Error message containers use `aria-live="polite"` and semantic role where needed.
- Auth buttons include descriptive labels (not icon-only).
- Color is not sole state indicator.
- Focus order follows visual order.

## Risks and Mitigations
- Risk: Over-coupling to mock auth behavior.
  - Mitigation: strict interface boundary and zero mock-specific logic in UI components.
- Risk: Route move regressions.
  - Mitigation: move incrementally and verify every route immediately after move.
- Risk: Future SSR auth mismatch.
  - Mitigation: keep guard logic isolated and prepared for server-side session extraction.

## Definition of Done
- Auth and onboarding screens exist and are reachable.
- Existing main app routes are guarded.
- Social login button framework exists with Google as first provider (mock action).
- Type check passes.
- Backlog is updated with implementation status and follow-up tasks.
