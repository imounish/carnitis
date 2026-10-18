# Security Baseline

## Build safety
- `typescript.ignoreBuildErrors` is not set; type errors fail `npm run build`.

## HTTP security headers
Defined in `next.config.mjs` (`headers()`), applied to all routes:
- `Content-Security-Policy-Report-Only` (switch to `Content-Security-Policy` once verified against production traffic)
- `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`
- `Referrer-Policy`, `Permissions-Policy`

Next 16 deprecates `middleware.ts`, so headers live in config rather than middleware.

## Authentication (Better Auth, `lib/auth/auth.ts`)
- Sessions expire after 7 days and refresh at most daily.
- Secure cookies are enabled whenever `BETTER_AUTH_URL` is https.
- Built-in rate limiting is enabled (100 requests/60s per client; Better Auth applies stricter limits to sign-in and sign-up paths).
- CSRF protection and origin checks come from Better Auth with `trustedOrigins`.

## Data access (Supabase)
- RLS is enabled on every user-owned table: `user_profiles`, `cars`, `entries`, `maintenance_schedule_items`, `todo_items` (`20260316101500_create_domain_tables_and_rls.sql`).

## Rollback
Revert the T017 commit. Emergency fallback only: re-add `typescript.ignoreBuildErrors: true`.
