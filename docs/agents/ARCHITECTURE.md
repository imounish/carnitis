# Architecture Guide

## 1. Current High-Level Shape
- `app/`: Next.js App Router routes and layouts.
- `components/`: reusable UI and domain views.
- `lib/auth`: auth service contracts and implementations.
- `lib/db`: domain data contracts and Supabase adapter (all 4 domains + dashboard fully migrated; mock facade deleted in T020).
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
- Avoid leaking Supabase response shapes directly into UI.
- Centralize mapping/parsing from DB rows to domain types in `lib/db/supabase/mappers.ts`.
- All server-only Supabase access goes through `lib/db/server.ts` → `getServerDataAccess()` and the implementation in `lib/db/supabase/`.
- Route pages fetch data server-side and pass to client components as props. Do not fetch data in `useEffect` on the client.
- `lib/db/api.ts` and `lib/db/mock/` have been deleted (T020). No mock data layer remains in the codebase.
- After T020, the mock layer (`lib/db/api.ts`, `lib/db/mock/`) will be deleted entirely.

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
- Treat maintenance `status` as derived server-owned output from canonical due fields plus current mileage/date. Persist it for convenience, but do not trust the stored value on reads when the canonical inputs are already available.
- When two routes can express the same business event, converge on one transactional path rather than duplicating logic. Maintenance completion now routes through `/entries` instead of adding a second maintenance-only completion workflow.
- Keep shared selectors scoped to the surface they already serve. For todos, `listAll()` stays dashboard-active-only; route-wide “all cars” views that need completed rows should aggregate per-car reads instead of widening the shared selector and regressing another screen.

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
- Normalize Postgres `DATE` columns in the row-mapper seam before they enter domain helpers. Some drivers surface them as `Date` objects, and allowing that shape to leak into date-only business logic will break local-date comparisons and formatting.

## 7. Performance Strategy
- Prefer Server Components by default.
- Use Client Components only when interactivity/browser APIs are required.
- Keep expensive charts/lists virtualized or progressively rendered when needed.
- Avoid unnecessary re-fetching; use cache/revalidation deliberately.

## 8. Code Quality Mandate
- Code must be simplistic, minimal, and easy to understand.
- No logic should exist in more than one place. Deduplicate aggressively.
- Abstractions must earn their existence — delete any that don't reduce total complexity.
- Names must be meaningful and self-documenting.
- If you can delete it and nothing breaks, it shouldn't exist.
- Shared infrastructure (API route patterns, validation primitives, error payloads, mappers) should be consolidated, not copy-pasted per domain.

## 9. Migration Status
All 4 core domains (cars, entries, maintenance, todos) are fully migrated to Supabase. The remaining migration is:
- **Dashboard** (T020): still uses mock data via `lib/db/api.ts`; will be migrated to server-side data fetching
- After T020, the mock facade and all mock data files can be deleted
