# IP-001: Auth + Onboarding UI Foundation (Mock-backed)

## Metadata
- Task ID: `T001`
- Title: `Auth + Onboarding UI Foundation (mock-backed)`
- Priority: `P0`
- Owner: AI pair session with user
- Status: `completed`
- Related backlog item: `T001`

## 1. Problem Statement
The app needed an auth and onboarding UX foundation before real backend integration existed. The current implementation solved the route structure, forms, and user-flow scaffolding with a mock adapter, but it should no longer be treated as the final authentication architecture.

## 2. Goals
- Provide accessible sign-in, sign-up, onboarding, and protected-app route structure.
- Keep auth UI isolated from backend-specific implementation details.
- Preserve a clean migration path from mock auth to Better Auth-backed production auth.

## 3. Non-Goals
- No real Better Auth integration in this task.
- No live Supabase or PostgreSQL reads/writes.
- No production social login, email verification, or password reset flows.

## 4. Scope
### In Scope
- `app/(auth)` and `app/(app)` route separation.
- Shared auth UI components and onboarding form.
- Mock `AuthService` contract and session bootstrap.

### Out Of Scope
- Server-side session enforcement.
- Real provider configuration.
- Persistent onboarding/profile data in the database.

## 5. Constraints And Assumptions
- The shipped implementation is client-side and mock-backed.
- Better Auth is the successor architecture for real auth, not Supabase Auth.
- Follow-on tasks `T002`, `T002A`, `T003`, `T003A`, and `T004` replace the original “Supabase-ready auth” assumption.

## 6. Architecture And Design
- Affected layers/modules:
  - `app/(auth)`, `app/(app)`
  - `components/auth/*`
  - `lib/auth/types.ts`
  - `lib/auth/service.ts`
  - `lib/auth/mock-auth-service.ts`
  - `lib/auth/auth-context.tsx`
- Data model changes:
  - None. Mock storage only.
- Auth/security impact:
  - UI-only auth simulation; not suitable for production security decisions.
- Mobile-first UX approach:
  - Auth flows are already mobile-first and remain the UX baseline for real auth integration.

## 7. Implementation Steps
1. Define typed auth contracts and session/user models.
2. Implement mock auth adapter with deterministic sign-in/sign-up/OAuth stubs.
3. Add auth context and session bootstrap helpers.
4. Build auth screens and onboarding UX.
5. Move product routes under a protected app route group.

## 8. Test Plan
- Unit tests:
  - Contract and helper coverage for auth parsing/state transitions.
- Integration tests:
  - Auth form submission and error handling.
- E2E/smoke tests:
  - Sign-in, sign-up, onboarding, redirect smoke coverage.
- Regression tests:
  - Route-group behavior and auth-shell rendering.

## 9. QA Plan
- Responsive breakpoints to validate:
  - 320x568, 375x812, 768x1024, 1024x768, desktop.
- Accessibility checks:
  - Labels, focus order, keyboard submit, `aria-live` errors.
- Manual user flows:
  - Sign up -> onboarding -> app.
  - Sign in failure states.
  - Sign out and redirect behavior.

## 10. Rollout And Rollback
- Rollout plan:
  - Keep this foundation as-is until Better Auth migration tasks land.
- Rollback plan:
  - Revert auth UI changes independently of domain/data migration work.
- Monitoring plan:
  - Limited to local/manual QA because this task is mock-only.

## 11. Risks And Mitigations
- Risk:
  - Teams assume mock auth is production-ready.
- Mitigation:
  - Backlog now explicitly treats this task as UI scaffolding only.
- Risk:
  - Future auth migration couples to mock-only behavior.
- Mitigation:
  - Keep `AuthService` contract stable and move real auth behind new server utilities.

## 12. Acceptance Criteria
- [x] Accessible sign-in, sign-up, and onboarding screens exist.
- [x] Product routes are separated from auth routes.
- [x] Mock auth service is isolated from UI components.
- [x] Follow-on Better Auth migration work is tracked separately in the backlog.

## 13. Definition Of Done Check
- [x] Code complete
- [x] Tests complete
- [x] Docs/plans updated
- [x] Quality gates passed
