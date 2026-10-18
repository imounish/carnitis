# IP-017: Security + Privacy Baseline

## Metadata
- Task ID: T017
- Title: Security + Privacy Baseline
- Priority: P0
- Status: `done`
- Related backlog item: T017

## 1. Problem Statement
The application has several security gaps that must be closed before production deployment:
- `next.config.mjs` has `ignoreBuildErrors: true` — type errors silently ship
- No `middleware.ts` exists — no security headers at the edge
- No CSP, HSTS, X-Frame-Options, or X-Content-Type-Options headers
- Better Auth session policy uses defaults without explicit hardening
- No rate limiting on auth endpoints

## 2. Goals
- Remove `ignoreBuildErrors: true` and fix any surfaced type errors
- Add security headers via Next.js middleware
- Audit and harden Better Auth session configuration
- Verify RLS coverage on all user-owned tables
- Document security posture

## 3. Non-Goals
- WAF or DDoS protection (infrastructure-level)
- Penetration testing
- SOC2 or compliance certification
- Complex CSP with nonces (can iterate later)

## 4. Scope
### In Scope
- Remove `ignoreBuildErrors: true` from `next.config.mjs`
- Fix any TypeScript build errors that surface
- Create `middleware.ts` with security headers
- Audit Better Auth session policy (expiry, cookie flags, CSRF)
- Verify RLS policies on all tables
- Consider rate limiting on `/api/auth/` endpoints

### Out Of Scope
- Application-level authorization beyond RLS
- PII audit or data classification
- Logging/monitoring (see T022)

## 5. Constraints And Assumptions
- Better Auth handles CSRF protection and secure cookies by default
- Supabase RLS policies already exist on all user-owned tables (from T005A)
- Next.js middleware runs at the edge before route handlers

## 6. Architecture And Design
- **New file**: `middleware.ts` at project root
- **Modified file**: `next.config.mjs` — remove `ignoreBuildErrors`
- **Modified file**: `lib/auth/auth.ts` — review/harden session config
- **Auth/security impact**: Direct — this is the security task

## 7. Implementation Steps
1. Remove `ignoreBuildErrors: true` from `next.config.mjs`
2. Run `npx tsc --noEmit` and `npm run build` — fix all surfaced errors
3. Create `middleware.ts` with security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
4. Review Better Auth session configuration — set explicit `expiresIn`, `updateAge`, secure cookie attributes
5. Audit RLS policies against current schema (ensure no table lacks RLS)
6. Evaluate rate limiting options for auth endpoints
7. Document security baseline in `docs/agents/SECURITY_BASELINE.md`
8. Run quality gates

## 8. Test Plan
- Build must pass without `ignoreBuildErrors`
- Verify security headers present in responses (manual or automated check)
- Verify auth session behavior (login, expiry, refresh)
- Verify RLS prevents cross-user data access

## 9. Rollout And Rollback
- Rollout: Single PR
- Rollback: Revert PR; re-add `ignoreBuildErrors` as emergency fallback

## 10. Risks And Mitigations
- Risk: Removing `ignoreBuildErrors` surfaces many type errors
  - Mitigation: Fix incrementally; most errors are likely minor
- Risk: Overly strict CSP breaks legitimate functionality
  - Mitigation: Start with report-only mode, then enforce

## 11. Acceptance Criteria
- [x] `ignoreBuildErrors: true` removed from `next.config.mjs`
- [x] `npm run build` passes cleanly
- [x] Security headers applied to all routes via `next.config.mjs` `headers()` (Next 16 deprecates `middleware.ts`); CSP is report-only
- [x] Better Auth session policy explicitly configured
- [x] RLS verified on all user-owned tables
- [x] Security baseline documented
