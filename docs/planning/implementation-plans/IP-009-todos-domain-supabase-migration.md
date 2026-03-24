# IP-009: Todo Route Migration To Supabase

## Metadata
- Task ID: `T009`, `T009A`
- Title: Todo Route Cutover, Direct Management, And Entry Convergence
- Priority: `P1`
- Owner: AI pair session with user
- Status: `completed`
- Related backlog item: `T009`, `T009A`

## 1. Problem Statement
The todo schema, RLS, mappers, and entry-linked completion workflow already existed in Supabase, but `/todos` was still a mock-backed client route. The feature needed a real route-level cutover so reads, direct CRUD, and entry-linked convergence could operate against one consistent domain state.

## 2. Goals
- Move `/todos` onto the real Supabase data path with URL-driven car selection.
- Complete direct todo management with create, edit, delete, and direct status changes.
- Converge todo-linked completion onto the existing `/entries` workflow instead of duplicating business logic.
- Keep dashboard/shared todo surfaces intentionally transitional for now.

## 3. Non-Goals
- No dashboard todo-widget migration.
- No notification/reminder system.
- No second multi-table task-completion workflow outside `/entries`.

## 4. Scope
### In Scope
- Server-loaded `/todos` route using `?car=all|<carId>`.
- Real per-car and all-cars todo reads.
- `POST /api/todos`, `PATCH /api/todos/:id`, and `DELETE /api/todos/:id`.
- Repository delete support and direct-status normalization.
- Todo deep links into `/entries` plus todo preselection there.
- Todo-focused unit, component, and local-DB integration coverage.

### Out Of Scope
- Dashboard/shared todo cutover.
- Bulk edit workflow expansion.
- New prioritization or reminder features.

## 5. Constraints And Assumptions
- Technical constraints:
  - entry-linked completion must remain inside the transactional entry workflow,
  - clients must not author `linked_entry_id` directly,
  - the shared `listAll()` selector remains dashboard-active-only,
  - mobile-first dialog management should remain route-local.
- Product constraints:
  - familiar status/priority ordering must remain stable,
  - the route should keep the existing all-cars view while supporting specific-car filtering.
- Assumptions:
  - direct delete is part of `T009`,
  - `/entries?car=<carId>&todo=<todoId>` is the right convergence seam for entry-linked completion from a task.

## 6. Architecture And Design
- Affected layers/modules:
  - `app/(app)/todos/page.tsx`
  - `components/todos/todos-view.tsx`
  - `app/api/todos/route.ts`
  - `app/api/todos/[id]/route.ts`
  - `lib/db/todo-api.ts`
  - `lib/db/todo-form.ts`
  - `lib/db/todo-helpers.ts`
  - `lib/db/contracts.ts`
  - `lib/db/mock/data-access.ts`
  - `lib/db/supabase/data-access.ts`
  - `app/(app)/entries/page.tsx`
  - `components/entries/entry-log-view.tsx`
- Data model changes:
  - no schema migration was required,
  - direct completion/reopen normalizes `completed_at` and `linked_entry_id` server-side,
  - the all-cars route view aggregates `listByCarId()` server-side so completed/cancelled items remain visible.
- Auth/security impact:
  - all route mutations are scoped through the signed-in Better Auth user,
  - create verifies the selected car exists for that user,
  - direct update/delete treat missing and foreign ids the same way with `404`,
  - entry preselection only accepts owned, open, unlinked todo rows for the selected car.
- Mobile-first UX approach:
  - preserve the current card list, summary boxes, and fixed mobile CTA,
  - keep create/edit in dialogs,
  - use explicit destructive confirmation and a visible “Log Entry” convergence action on active tasks.

## 7. Implementation Steps
1. Cut over `/todos` to a server-loaded route:
   - load owned cars from `getServerDataAccess()`
   - resolve `?car=` to `all` or a valid owned car id
   - aggregate per-car reads for the all-cars route view
2. Add server-owned route mutations:
   - `POST /api/todos`
   - `PATCH /api/todos/:id`
   - `DELETE /api/todos/:id`
   - framework-light payload parsing and user-safe error serialization in shared helpers
3. Finish direct todo management:
   - add repository delete support in both mock and Supabase adapters
   - normalize direct status changes so completion timestamps and linkage fields are server-owned
   - add dialog-driven edit/delete and route refresh on success
4. Converge with `/entries`:
   - add todo deep links to `/entries?car=<carId>&todo=<todoId>`
   - preselect the todo on `/entries`
   - strip prefill params after successful submit
5. Capture learnings:
   - document the all-cars route read shape
   - document the Radix Select jsdom harness fix

## 8. Test Plan
- Unit tests:
  - todo payload parsing/builders
  - direct-status normalization
  - edit diff generation
- Component tests:
  - create todo
  - toggle complete/reopen
  - edit with empty-change guard
  - delete confirmation
  - car filter URL sync
  - todo preselection on `/entries`
- Integration tests:
  - owner-scoped row access and delete behavior
  - route/display ordering semantics
  - direct reopen clears linkage fields
- Regression tests:
  - `/todos` empty state with no cars
  - `/entries` resets prefill params after successful submit

## 9. QA Plan
- Responsive breakpoints to validate:
  - 320x568
  - 375x812
  - 768x1024
  - 1024x768
- Accessibility checks:
  - task controls have visible labels
  - delete confirmation is keyboard reachable
  - status/priority are not communicated by color alone
- Manual user flows:
  - create, edit, toggle, and delete a task
  - switch between all-cars and per-car views
  - launch “Log Entry” from a task and verify the task returns as completed from real data

## 10. Rollout And Rollback
- Rollout plan:
  - ship the `/todos` route migration as one bounded route-level cutover
  - keep dashboard/shared mock todo selectors unchanged
  - converge task-linked completion only through `/entries`
- Rollback plan:
  - point `/todos` back to the transitional mock facade if route behavior regresses
  - disable the todo API routes if direct update/delete behavior is incorrect
  - revert todo preselection in `/entries` if convergence causes confusion
- Monitoring plan:
  - todo route mutation failures
  - invalid todo-link attempts from `/entries`
  - regressions where completed tasks disappear from the all-cars route view

## 11. Risks And Mitigations
- Risk: widening `listAll()` for the route would regress dashboard behavior.
- Mitigation: keep `listAll()` active-only and aggregate per-car reads on the route.
- Risk: direct edits could tamper with entry linkage fields.
- Mitigation: strip client-authored linkage fields and recompute direct completion metadata server-side.
- Risk: Radix Select interactions fail in jsdom and mask actual route behavior.
- Mitigation: stub pointer-capture methods once in the shared Vitest setup instead of weakening individual tests.

## 12. Acceptance Criteria
- [x] `/todos` reads use Supabase with URL-driven car selection.
- [x] Direct todo create, edit, delete, and status changes use server-owned mutations.
- [x] Dashboard/shared todo surfaces remain intentionally transitional.
- [x] Todo-to-entry convergence uses the existing `/entries` workflow instead of duplicating completion logic.
- [x] Tests cover the new route, helpers, and DB-backed ownership behavior.

## 13. Definition Of Done Check
- [x] Code complete
- [x] Tests complete
- [x] Docs/plans updated
- [x] Quality gates passed
