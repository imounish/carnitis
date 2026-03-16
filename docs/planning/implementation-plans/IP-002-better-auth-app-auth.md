# IP-002: Better Auth App Authentication

## Metadata
- Task ID: `T002`, `T002A`, `T004`
- Title: Better Auth Core Integration for App Authentication
- Priority: `P0`
- Owner: AI pair session with user
- Status: `draft`
- Related backlog item: `T002`

## 1. Problem Statement
Current auth is entirely client-side and mock-backed. [`lib/auth/auth-context.tsx`](/Users/mounish/workspace/projects/car-expense/carnitis/lib/auth/auth-context.tsx) instantiates [`MockAuthService`](/Users/mounish/workspace/projects/car-expense/carnitis/lib/auth/mock-auth-service.ts), and protected routing is not anchored to a server session. The app needs real authentication using Better Auth, backed by Supabase Postgres, without forcing a large auth UI rewrite.

## 2. Goals
- Make Better Auth the application auth system for email/password and social login.
- Preserve the existing auth UI contract by mapping Better Auth responses into the `AuthService` model.
- Move session checks and protected routing to the server boundary.
- Support onboarding-aware routing after sign-up and sign-in.

## 3. Non-Goals
- No organization or RBAC plugin work in this phase.
- No password reset or email verification unless tracked as a follow-up task.
- No attempt to migrate existing mock users into a production identity store.

## 4. Scope
### In Scope
- Better Auth server configuration and route handler.
- Better Auth client wiring for sign-in, sign-up, sign-out, and session fetch.
- A Better Auth-backed `AuthService` adapter.
- Server-side session helpers for route protection and app shell behavior.
- Google OAuth as the first provider after core auth is working.

### Out Of Scope
- Multi-provider expansion beyond Google.
- Admin tools for user management.
- Authorization beyond signed-in user ownership.

## 5. Constraints And Assumptions
- Technical constraints: Better Auth needs a server-side database connection and its own auth tables. The current app also needs app-specific profile fields not guaranteed by Better Auth core.
- Product constraints: the sign-in, sign-up, and onboarding UX should remain recognizable and mobile-first.
- Assumptions:
  - Better Auth will use the Supabase Postgres database directly.
  - App-specific auth-facing profile state will live in a first-party profile table keyed to the Better Auth user id.
  - A temporary service factory is acceptable if it reduces rollout risk while mock and Better Auth adapters coexist.

## 6. Architecture And Design
- Affected layers/modules:
  - `app/api/auth/[...all]/route.ts`
  - `lib/auth/auth.ts`
  - `lib/auth/client.ts`
  - `lib/auth/better-auth-service.ts`
  - `lib/auth/server-session.ts`
  - `lib/auth/auth-context.tsx`
  - `app/(app)/layout.tsx`
- Data model changes:
  - Better Auth tables in Supabase Postgres.
  - App-owned `user_profiles` table with `user_id`, `display_name`, `avatar_url`, `onboarding_completed`, timestamps.
- Auth/security impact:
  - Better Auth replaces mock browser storage as the source of truth for session state.
  - Protected routes must read server session state, not client cache.
  - OAuth credentials and secrets remain server-only.
- Mobile-first UX approach:
  - Preserve existing auth screens and form ergonomics.
  - Keep redirects predictable after sign-in and onboarding completion.

## 7. Implementation Steps
1. Add Better Auth runtime foundation:
   - Create the Better Auth server config and API route.
   - Define the auth env contract from `T003A`.
   - Add a profile storage strategy for onboarding state.
2. Implement the app auth adapter:
   - Create a Better Auth-backed `AuthService` implementation that maps Better Auth user/session data into [`lib/auth/types.ts`](/Users/mounish/workspace/projects/car-expense/carnitis/lib/auth/types.ts).
   - Replace direct mock instantiation in the auth context with a service factory.
3. Introduce server session helpers:
   - Add helpers for `getServerSession`, `requireUser`, and redirect decisions.
   - Update the `(app)` layout and auth routes to use server-aware protection.
4. Wire onboarding-aware profile sync:
   - On sign-up, create or upsert the app profile row.
   - On onboarding completion, update the profile row and refresh the session-facing view model.
5. Add Google login:
   - Configure Better Auth social provider support.
   - Reuse the existing provider button UI with Better Auth-backed actions.

## 8. Test Plan
- Unit tests:
  - auth result mapping from Better Auth payloads to `AuthUser` and `AuthSession`
  - onboarding profile merge helpers
- Integration tests:
  - sign-up, sign-in, sign-out, and onboarding completion flows
  - server redirect behavior for signed-out and onboarding-incomplete users
  - Google provider initiation behavior with provider mocks
- E2E/smoke tests:
  - sign-in -> app shell
  - sign-up -> onboarding -> app shell
  - signed-out access to protected routes redirects correctly
- Regression tests:
  - auth pages still render usable validation and error states on mobile breakpoints

## 9. QA Plan
- Responsive breakpoints to validate:
  - 320x568
  - 375x812
  - 768x1024
  - 1024x768
- Accessibility checks:
  - field labels and autocomplete attributes
  - keyboard-only submit and focus order
  - live error messaging and redirect clarity
- Manual user flows:
  - email/password sign-up
  - email/password sign-in failure and recovery
  - onboarding completion
  - sign-out
  - Google sign-in initiation and callback

## 10. Rollout And Rollback
- Rollout plan:
  - Land Better Auth config and adapter behind a service factory if needed.
  - Switch protected layouts after server session helpers are stable.
  - Enable Google only after email/password flows are stable.
- Rollback plan:
  - Revert the service factory to the mock adapter.
  - Disable the Better Auth route handler and provider buttons.
  - Preserve the old auth UI so only the provider layer rolls back.
- Monitoring plan:
  - Track auth failures, callback errors, session lookup failures, and redirect loops.

## 11. Risks And Mitigations
- Risk: Better Auth user data and app profile data drift apart.
- Mitigation: define a single profile upsert path and test sign-up plus onboarding transitions.
- Risk: client and server session state diverge during rollout.
- Mitigation: treat server session helpers as authoritative and keep client state as a view cache only.
- Risk: social login increases scope before core auth is stable.
- Mitigation: keep `T004` dependent on `T002`.

## 12. Acceptance Criteria
- [ ] Better Auth is the live auth system for app sign-in and sign-up.
- [ ] Protected app routes use server-side session checks.
- [ ] `AuthService` remains the UI-facing seam and no auth page imports Better Auth directly.
- [ ] Onboarding completion is persisted outside client-only state.
- [ ] Google login works through the existing provider button model.

## 13. Definition Of Done Check
- [ ] Code complete
- [ ] Tests complete
- [ ] Docs/plans updated
- [ ] Quality gates passed
