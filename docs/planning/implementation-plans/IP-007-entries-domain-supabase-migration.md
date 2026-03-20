# IP-007: Entries Feature Full Cutover To Supabase

## Metadata
- Task ID: `T007`, `T007A`
- Title: Entries Feature Reads, Writes, And In-feature Linkage Migration
- Priority: `P0`
- Owner: AI pair session with user
- Status: `completed`
- Related backlog item: `T007`

## 1. Problem Statement
The `/entries` route is a write-first workflow, so a reads-only migration would have produced an incoherent mixed page. The clean cutover was to move the whole in-feature entries experience to Supabase at once: server-loaded car context, real entry history, transactional create, and the linked maintenance/todo updates that are triggered by entry writes.

## 2. Goals
- Make `/entries` a real Supabase-backed feature route without switching the shared dashboard/mock facades yet.
- Introduce a transactional server-side write path for entry creation.
- Keep the `Entry` domain contract stable for UI consumers.
- Pull entry-owned maintenance/todo linkage into the same transaction so the feature remains coherent.

## 3. Non-Goals
- No chart redesign or analytics expansion in this phase.
- No dashboard recent-entry migration in this phase.
- No maintenance-route or todo-route UI migration in this phase.
- No direct client-side multi-table mutation logic.

## 4. Scope
### In Scope
- `/entries` server route migration to Supabase with `?car=` selection.
- Entries list-by-car reads for the selected car history section.
- Entry creation workflow with car aggregate synchronization.
- Real maintenance/todo option reads needed by the entry form.
- Validation for fuel, maintenance expense, and maintenance-done entry variants.
- Entry-triggered maintenance and todo linkage updates inside the same transaction.

### Out Of Scope
- Dashboard recent entries and global summaries.
- Maintenance route UI convergence.
- Todo route UI convergence.
- Advanced reporting features beyond existing stats needs.

## 5. Constraints And Assumptions
- Technical constraints:
  - entry writes must update related tables atomically,
  - car totals and current mileage cannot be trusted to client code,
  - the shared client-safe mock facade must stay in place for other domains until their migrations land.
- Product constraints:
  - entry logging is a primary mobile workflow and cannot become slower or more error-prone.
- Assumptions:
  - a server-side transactional function or equivalent controlled workflow will be used for writes,
  - `/entries` remains a log-first page with recent history below the form,
  - if a route is write-first, merging its read and write tasks may be cleaner than preserving an artificial split.

## 6. Architecture And Design
- Affected layers/modules:
  - entries page server loader
  - entries repository/service
  - entry validation schemas
  - transactional mutation wrapper
  - entries feature view and recent history section
- Data model changes:
  - keep entry ownership strategy aligned with cars
  - use list-by-car query as the feature read seam
  - keep aggregate update path for car totals and mileage in the server transaction
  - fix `todo_items.linked_entry_id` to reference `entries.id` directly with `on delete set null`
- Auth/security impact:
  - writes must verify car ownership before mutating anything
  - linked updates must not bypass ownership boundaries
  - nullable linkage FKs must not attempt to null non-null ownership columns
- Mobile-first UX approach:
  - keep entry forms optimized for quick logging on phone screens
  - preserve concise error feedback and submit affordances
  - keep the history section secondary to the form on small screens

## 7. Implementation Steps
1. Convert `/entries` into an async server page and load:
   - owned cars
   - selected car from `?car=`
   - selected car maintenance items
   - selected car open todos
   - selected car recent entries
2. Refactor the entries view into a prop-driven client component.
3. Add shared entry payload parsing/normalization for:
   - fuel
   - maintenance expense
   - maintenance done
4. Add `POST /api/entries` with Better Auth session checks and user-safe error responses.
5. Implement transactional entry create behind the repository seam:
   - verify owned car
   - verify linked maintenance/todo rows belong to the same user and car
   - insert entry
   - update car mileage if needed
   - update per-category totals safely
   - update linked maintenance due fields/status
   - update linked todo completion/link fields
6. Keep `lib/db/api.ts` transitional for dashboard and other routes.
7. Add a follow-up migration when implementation reveals schema defects in linked-entry referential integrity.

## 8. Test Plan
- Unit tests:
  - entry validation/payload parsing per entry variant
  - user-safe API payload helpers
- Integration tests:
  - per-car entry reads in deterministic order
  - entry creation success, validation failure, unauthorized car access, and aggregate update failure handling
  - maintenance/todo linkage updates
  - rollback on invalid linked rows
  - linked todo detaches cleanly if the linked entry is deleted
- E2E/smoke tests:
  - log fuel entry
  - log maintenance expense entry
  - log maintenance done entry
  - switch the selected car through `?car=`
  - verify recent history, mileage, and totals reflect the write
- Regression tests:
  - entry log form stays usable across phone and tablet breakpoints

## 9. QA Plan
- Responsive breakpoints to validate:
  - 320x568
  - 375x812
  - 768x1024
  - 1024x768
- Accessibility checks:
  - numeric input ergonomics
  - labels and inline validation messaging
  - focus behavior after submission failure
- Manual user flows:
  - create each entry variant
  - create an entry linked to a maintenance item
  - create an entry linked to a todo
  - switch cars through the selector and URL state
  - verify recent entries ordering
  - verify car totals update
  - verify linked todo/maintenance state changes

## 10. Rollout And Rollback
- Rollout plan:
  - ship the entries feature cutover as one bounded route-level migration
  - keep dashboard and other shared surfaces on transitional mock facades
- Rollback plan:
  - revert `/entries` to the mock-backed client flow if data correctness is at risk
  - revert the linked-entry FK migration if it causes unexpected schema regressions
- Monitoring plan:
  - failed entry writes
  - aggregate mismatch signals
  - validation failure rates

## 11. Risks And Mitigations
- Risk: aggregate totals drift from entries over time.
- Mitigation: keep updates server-side and add regression checks around totals and mileage.
- Risk: write-first route migrations become incoherent if reads and writes are split too aggressively.
- Mitigation: merge route-owned read and write work into one cutover when the UX depends on both.
- Risk: composite nullable FKs can conflict with non-null ownership columns.
- Mitigation: keep ownership enforcement in RLS plus repository checks, and use single-column nullable FKs for detachable links.

## 12. Acceptance Criteria
- [x] `/entries` reads use Supabase for the feature route.
- [x] Entry creation uses a transactional server-side workflow.
- [x] Car mileage and totals update correctly from entry writes.
- [x] Entry forms use shared validation and surface actionable errors.
- [x] Entry-linked maintenance and todo updates run in the same transaction.
- [x] Selected-car state is URL-driven through `?car=`.

## 13. Definition Of Done Check
- [x] Code complete
- [x] Tests complete
- [x] Docs/plans updated
- [x] Quality gates passed
