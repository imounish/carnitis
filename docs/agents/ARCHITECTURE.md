# Architecture Guide

## 1. Current High-Level Shape
- `app/`: Next.js App Router routes and layouts.
- `components/`: reusable UI and domain views.
- `lib/auth`: auth service contracts and implementations.
- `lib/db`: domain data contracts and mock adapter.
- `supabase/`: local Supabase config, migrations, seed scripts.

## 2. Routing Boundaries
- `app/(auth)`: authentication and onboarding experience.
- `app/(app)`: authenticated product area.
- `app/layout.tsx`: global providers, theme, analytics, top-level metadata.

Guideline:
- Keep page files focused on orchestration.
- Move reusable business/UI logic into `components/` and `lib/`.

## 3. Domain/Data Boundaries
Use a layered model:
1. UI layer: components + route handlers.
2. Domain/service layer: typed operations and business rules.
3. Data adapter layer: Supabase queries (or mock adapter where still transitional).

Rules:
- Preserve service interfaces while migrating from mock to Supabase.
- Avoid leaking Supabase response shapes directly into UI.
- Centralize mapping/parsing from DB rows to domain types.

## 4. Auth Boundaries
- Use `AuthService` interface as the contract.
- Keep provider-specific/auth transport details out of UI components.
- Use guards/layout boundaries for route protection.

## 5. Supabase Architecture Strategy
For production-grade implementation:
- Keep SQL schema changes in versioned migrations under `supabase/migrations`.
- Enforce RLS on all user-owned tables.
- Prefer least-privilege access and server-side data access for sensitive operations.
- Store secrets only in env vars; never in source.

Recommended environment contract:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` (server-only)

## 6. Error Handling Strategy
- Return typed errors from services.
- Separate user-safe messages from internal diagnostics.
- Never expose secrets, raw SQL errors, or stack traces in user UI.

## 7. Performance Strategy
- Prefer Server Components by default.
- Use Client Components only when interactivity/browser APIs are required.
- Keep expensive charts/lists virtualized or progressively rendered when needed.
- Avoid unnecessary re-fetching; use cache/revalidation deliberately.
