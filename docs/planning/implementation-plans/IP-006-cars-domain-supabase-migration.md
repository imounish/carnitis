# IP-006: Cars Domain Migration To Supabase

## Metadata
- Task ID: `T006`, `T006A`
- Title: Cars Domain Reads + Car Management Migration
- Priority: `P1`
- Owner: AI pair session with user
- Status: `completed`
- Related backlog item: `T006`, `T006A`

## 1. Problem Statement
Cars are the root aggregate for nearly every product surface. The repository already has a safe Supabase data seam, but the public [`lib/db/api.ts`](/Users/mounish/.codex/worktrees/d9ef/carnitis/lib/db/api.ts) facade is still fully mock-backed and the `/cars` surfaces still fetch on the client. Without a scoped cutover, either the cars experience stays mock-only or the app risks mixing real cars with transitional downstream domains in an uncontrolled way.

## 2. Goals
- Move `/cars` list reads to Supabase.
- Move `/cars/[id]` core car reads to Supabase.
- Fold car creation into the same release so the cars flow remains coherent.
- Complete car management with edit and delete on the real Supabase-backed cars flow.
- Preserve the existing public `lib/db` mock seam for non-car screens until their domain tasks land.

## 3. Non-Goals
- No entries, maintenance, todos, or dashboard migration in this task.
- No compatibility layer that mixes real cars with mock related-domain records on the detail page.
- No inline editing or modal-based car management UX.

## 4. Scope
### In Scope
- Server-loaded `/cars` list and `/cars/[id]` detail pages.
- Cars-only detail presentation using fields already stored on `cars`.
- `POST /api/cars` create endpoint.
- `PATCH` and `DELETE` on `/api/cars/[id]`.
- Dedicated `/cars/[id]/edit` page with a shared car form.
- Detail-page edit/delete actions for the real cars flow.
- Client form submission for create/edit via the server mutation boundary.

### Out Of Scope
- Shared car selectors outside the cars feature.
- Related tabs, charts, and data that depend on entries, maintenance, or todos.
- Shared selector convergence for dashboard, entries, maintenance, and todos.

## 5. Constraints And Assumptions
- Technical constraints:
  - user-owned reads and writes must stay server-scoped,
  - the public `lib/db/api.ts` contract remains mock-backed for transitional domains,
  - the detail page cannot safely show related domain data until T007-T009 land,
  - update/delete must treat missing and foreign-owned ids the same way.
- Product constraints:
  - the add-car flow must remain functional after reads move to Supabase,
  - delete confirmation must clearly communicate the permanent effect.
- Assumptions:
  - dashboard, entries, maintenance, and todos can continue using mock car selectors temporarily,
  - a reduced car-only detail page is acceptable until the related domains migrate,
  - hard delete is acceptable for cars at this stage of the migration.

## 6. Architecture And Design
- Affected layers/modules:
  - `app/(app)/cars/page.tsx`
  - `app/(app)/cars/[id]/page.tsx`
  - `app/(app)/cars/[id]/edit/page.tsx`
  - `app/api/cars/route.ts`
  - `app/api/cars/[id]/route.ts`
  - `components/cars/*`
- Data model changes:
  - no new schema required; use the existing `cars` table, indexes, and RLS.
- Auth/security impact:
  - pages load cars through `getServerDataAccess()`,
  - create/update/delete use server routes that resolve the Better Auth session before calling the cars repository,
  - foreign or missing cars resolve to `notFound()` on pages and `404` from id-scoped mutation routes,
  - delete relies on existing owned-child foreign keys with `on delete cascade`.
- Mobile-first UX approach:
  - reuse one mobile-safe car form for both create and edit,
  - keep the detail page simplified rather than leaving broken or misleading related-data sections on mobile,
  - make destructive actions explicit with a confirmation dialog instead of a hidden overflow action.

## 7. Implementation Steps
1. Convert cars reads to server boundaries:
   - load `/cars` from `getServerDataAccess().cars.list()`
   - load `/cars/[id]` from `getServerDataAccess().cars.getById()`
   - keep `lib/db/api.ts` mock-backed for non-car surfaces
2. Refactor cars UI:
   - make `CarsListView` prop-driven
   - make `CarDetailView` prop-driven and car-only
   - replace related-domain tabs with a transitional notice
3. Add the create mutation boundary:
   - implement `POST /api/cars`
   - validate payloads with the shared car zod schema
   - submit the add-car form to the route instead of the mock API
4. Complete `T006A` car management on the real path:
   - extract a shared car form and shared payload builders for create/edit
   - implement `/cars/[id]/edit` with a server-loaded owned car
   - implement `PATCH` and `DELETE /api/cars/[id]`
   - add edit/delete actions to the real detail page with delete confirmation
5. Keep the hybrid boundary explicit after completion:
   - keep `lib/db/api.ts` mock-backed for dependent domains
   - do not reintroduce mock related-domain sections on the real car detail page

## 8. Test Plan
- Unit tests:
  - car-owned summary helpers
  - create/edit car form payload construction and initial-value mapping
  - update-car validation and empty-payload rejection
  - cars route payload serialization for not-found and empty-update cases
- Integration tests:
  - existing repository scoping coverage from T005 remains the baseline
  - local-db checks should verify update/delete ownership behavior
  - local-db checks should verify delete cascades to related rows
- E2E/smoke tests:
  - signed-in user sees an empty `/cars` state when no real cars exist
  - creating a car via `/cars/new` returns to `/cars` and shows the new record
  - `/cars/[id]` shows the real car-owned summary for owned records
  - editing a car via `/cars/[id]/edit` updates both the detail page and cars list
  - deleting a car from `/cars/[id]` returns to `/cars` after confirmation
  - foreign or missing `/cars/[id]` resolves to not-found

## 9. QA Plan
- Responsive breakpoints to validate:
  - 320x568
  - 375x812
  - 768x1024
  - >=1280
- Accessibility checks:
  - add/edit labels and submission feedback remain clear
  - delete confirmation is keyboard accessible
  - empty state and transitional detail notice remain readable and keyboard accessible
- Manual user flows:
  - create first car
  - browse cars list
  - open car detail
  - edit an owned car
  - cancel delete, then confirm delete
  - confirm dashboard/entries/maintenance/todos remain on the transitional mock car path

## 10. Rollout And Rollback
- Rollout plan:
  - ship cars routes first with direct server reads
  - ship create via `/api/cars`
  - ship edit/delete only inside the cars feature routes
  - leave shared selectors and downstream domains on mock data until later tasks
- Rollback plan:
  - point `/cars` pages back to the mock facade
  - disable the `/api/cars` routes and restore create/edit/delete to the mock seam if necessary
- Monitoring plan:
  - failed car page loads
  - failed create/update/delete requests
  - not-found frequency for `/cars/[id]`

## 11. Risks And Mitigations
- Risk: real cars appear only on `/cars`, while other screens still use mock selectors.
- Mitigation: keep the hybrid boundary explicit and documented until the dependent tasks land.
- Risk: the detail page feels temporarily reduced.
- Mitigation: show a clear transitional notice instead of stale or misleading mock-backed related sections.
- Risk: create or edit succeeds but the follow-up view shows stale data.
- Mitigation: return to a server-rendered route after success and refresh navigation state.
- Risk: delete removes more data than the current UI surfaces show.
- Mitigation: keep the delete copy explicit about permanent removal and future cascade behavior.

## 12. Acceptance Criteria
- [x] `/cars` list reads use Supabase.
- [x] `/cars/[id]` uses Supabase for the owned car record.
- [x] Car creation uses Supabase with validation and ownership checks.
- [x] Car editing uses Supabase with validation and ownership checks.
- [x] Car deletion uses Supabase with validation and ownership checks.
- [x] The real car detail page exposes edit/delete actions without restoring mock related sections.
- [x] Shared car selectors outside the cars feature remain on the mock facade during the transition.
- [x] `T006A` completes update/delete while preserving the transitional hybrid boundary.

## 13. Definition Of Done Check
- [x] Code complete
- [x] Tests complete
- [x] Docs/plans updated
- [x] Quality gates passed
