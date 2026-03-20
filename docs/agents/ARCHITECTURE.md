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
- Keep [`lib/db/api.ts`](/Users/mounish/workspace/projects/car-expense/carnitis/lib/db/api.ts) as the client-safe transitional facade while the UI still depends on mock data.
- Put server-only Supabase access behind [`lib/db/server.ts`](/Users/mounish/workspace/projects/car-expense/carnitis/lib/db/server.ts) and [`lib/db/supabase/`](/Users/mounish/workspace/projects/car-expense/carnitis/lib/db/supabase/).
- During partial domain migrations, move the real read/write path into feature-owned server pages and route handlers first, while leaving the shared transitional facade in place for dependent domains until their own migration tasks land.

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

Better Auth integration note:
- Better Auth owns application identity, so user-owned tables should carry `owner_user_id` references to `public.user(id)`.
- When RLS or ownership checks need the active user, use the application-scoped helper `app.current_user_id()` and set it from the server transaction context.
- If a child table references `(id, owner_user_id)`, the parent table must expose a matching composite unique constraint or the FK will fail at migration time.
- Do not use `on delete set null` on composite FKs that include non-null ownership columns. For detachable links such as `todo_items.linked_entry_id`, keep the nullable link column separate from `owner_user_id` and enforce ownership in RLS plus repository checks.
- If a route is write-first and the UX depends on route-local reads, prefer a single route-owned cutover over an artificial “reads first, writes later” split.

## 6. Error Handling Strategy
- Return typed errors from services.
- Separate user-safe messages from internal diagnostics.
- Never expose secrets, raw SQL errors, or stack traces in user UI.

## 6A. Temporal Data Boundaries
- Treat calendar-day values and real instants as different architectural concepts.
- Keep business dates such as entry dates, due dates, and maintenance schedule dates as `YYYY-MM-DD` strings all the way through the domain layer.
- Keep real instants such as `created_at`, `updated_at`, and `completed_at` as ISO UTC timestamps.
- Centralize date-only parsing, date-only arithmetic, and timestamp display helpers in one shared module; do not spread raw `Date` logic across features.
- If a temporal bug appears, audit whether the issue is in storage semantics or helper duplication before reaching for a schema migration.

## 7. Performance Strategy
- Prefer Server Components by default.
- Use Client Components only when interactivity/browser APIs are required.
- Keep expensive charts/lists virtualized or progressively rendered when needed.
- Avoid unnecessary re-fetching; use cache/revalidation deliberately.
