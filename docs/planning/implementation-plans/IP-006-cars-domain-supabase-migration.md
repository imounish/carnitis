# IP-006: Cars Domain Migration To Supabase

## Metadata
- Task ID: `T006`, `T006A`
- Title: Cars Domain Reads + Create Migration
- Priority: `P1`
- Owner: AI pair session with user
- Status: `in_progress` (`T006` complete and verified; `T006A` remains)
- Related backlog item: `T006`

## 1. Problem Statement
Cars are the root aggregate for nearly every product surface. The repository already has a safe Supabase data seam, but the public [`lib/db/api.ts`](/Users/mounish/.codex/worktrees/d9ef/carnitis/lib/db/api.ts) facade is still fully mock-backed and the `/cars` surfaces still fetch on the client. Without a scoped cutover, either the cars experience stays mock-only or the app risks mixing real cars with transitional downstream domains in an uncontrolled way.

## 2. Goals
- Move `/cars` list reads to Supabase.
- Move `/cars/[id]` core car reads to Supabase.
- Fold car creation into the same release so the cars flow remains coherent.
- Preserve the existing public `lib/db` mock seam for non-car screens until their domain tasks land.

## 3. Non-Goals
- No entries, maintenance, todos, or dashboard migration in this task.
- No update/delete flows in this task.
- No compatibility layer that mixes real cars with mock related-domain records on the detail page.

## 4. Scope
### In Scope
- Server-loaded `/cars` list and `/cars/[id]` detail pages.
- Cars-only detail presentation using fields already stored on `cars`.
- `POST /api/cars` create endpoint.
- Client form submission for add-car via the server mutation boundary.

### Out Of Scope
- Shared car selectors outside the cars feature.
- Car edit/delete UI or server handlers.
- Related tabs, charts, and data that depend on entries, maintenance, or todos.

## 5. Constraints And Assumptions
- Technical constraints:
  - user-owned reads and writes must stay server-scoped,
  - the public `lib/db/api.ts` contract remains mock-backed for transitional domains,
  - the detail page cannot safely show related domain data until T007-T009 land.
- Product constraints:
  - the add-car flow must remain functional after reads move to Supabase.
- Assumptions:
  - dashboard, entries, maintenance, and todos can continue using mock car selectors temporarily,
  - a reduced car-only detail page is acceptable until the related domains migrate.

## 6. Architecture And Design
- Affected layers/modules:
  - `app/(app)/cars/page.tsx`
  - `app/(app)/cars/[id]/page.tsx`
  - `app/api/cars/route.ts`
  - `components/cars/*`
- Data model changes:
  - no new schema required; use the existing `cars` table, indexes, and RLS.
- Auth/security impact:
  - pages load cars through `getServerDataAccess()`,
  - create uses a server route that resolves the Better Auth session before calling the cars repository,
  - foreign or missing cars resolve to `notFound()`.
- Mobile-first UX approach:
  - keep the existing add-car form ergonomics,
  - simplify the detail page rather than leaving broken or misleading related-data sections on mobile.

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
4. Defer remaining car management to `T006A`:
   - update
   - delete
   - detail-page follow-up once related domains are migrated

## 8. Test Plan
- Unit tests:
  - car-owned summary helpers
  - add-car form payload construction
  - create-car API payload parsing and error serialization
- Integration tests:
  - existing repository scoping coverage from T005 remains the baseline
  - route-level create behavior should be covered once broader request-handler integration tooling lands
- E2E/smoke tests:
  - signed-in user sees an empty `/cars` state when no real cars exist
  - creating a car via `/cars/new` returns to `/cars` and shows the new record
  - `/cars/[id]` shows the real car-owned summary for owned records
  - foreign or missing `/cars/[id]` resolves to not-found

## 9. QA Plan
- Responsive breakpoints to validate:
  - 320x568
  - 375x812
  - 768x1024
  - >=1280
- Accessibility checks:
  - add-car labels and submission feedback remain clear
  - empty state and transitional detail notice are readable and keyboard accessible
- Manual user flows:
  - create first car
  - browse cars list
  - open car detail
  - confirm dashboard/entries/maintenance/todos remain on the transitional mock car path

## 10. Rollout And Rollback
- Rollout plan:
  - ship cars routes first with direct server reads
  - ship create via `/api/cars`
  - leave shared selectors and downstream domains on mock data until later tasks
- Rollback plan:
  - point `/cars` pages back to the mock facade
  - disable the `/api/cars` route and restore add-car to the mock seam if necessary
- Monitoring plan:
  - failed car page loads
  - failed create requests
  - not-found frequency for `/cars/[id]`

## 11. Risks And Mitigations
- Risk: real cars appear only on `/cars`, while other screens still use mock selectors.
- Mitigation: keep the hybrid boundary explicit and documented until the dependent tasks land.
- Risk: the detail page feels temporarily reduced.
- Mitigation: show a clear transitional notice instead of stale or misleading mock-backed related sections.
- Risk: create succeeds but the list does not refresh.
- Mitigation: return to the server-rendered `/cars` route after success and refresh navigation state.

## 12. Acceptance Criteria
- [x] `/cars` list reads use Supabase.
- [x] `/cars/[id]` uses Supabase for the owned car record.
- [x] Car creation uses Supabase with validation and ownership checks.
- [x] Shared car selectors outside the cars feature remain on the mock facade during the transition.
- [x] Update/delete remain deferred to `T006A`.

## 13. Definition Of Done Check
- [x] Code complete
- [x] Tests complete
- [x] Docs/plans updated
- [x] Quality gates passed
