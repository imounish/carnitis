# IP-008: Maintenance Domain Migration To Supabase

## Metadata
- Task ID: `T008`, `T008A`, `T008B`
- Title: Maintenance Route Cutover, Direct Management, And Entry Convergence
- Priority: `P1`
- Owner: AI pair session with user
- Status: `completed`
- Related backlog item: `T008`, `T008A`, `T008B`

## 1. Problem Statement
The maintenance route was still a create-first client feature on the mock facade even though the real Supabase repository foundation already existed. A reads-only migration would have left `/maintenance` incoherent, because the feature depends on route-local reads, create, direct schedule management, and entry-linked service logging. The cutover needed to move the whole route to real data while preserving the shared mock facade for dashboard and other transitional screens.

## 2. Goals
- Make `/maintenance` a real Supabase-backed feature route with URL-driven car selection.
- Fold create into the same cutover so the route stays coherent after reads move to Supabase.
- Complete direct maintenance management with edit, delete, and scheduling recalculation.
- Converge maintenance completion onto the existing transactional `/entries` flow instead of duplicating business logic.
- Keep the public `lib/db/api.ts` mock seam in place for dashboard and other domains until their own migrations land.

## 3. Non-Goals
- No calendar or notification system.
- No dashboard maintenance-alert migration in this phase.
- No standalone maintenance-completion mutation outside the entry workflow.

## 4. Scope
### In Scope
- Server-loaded `/maintenance` route using `?car=<carId>`.
- Real per-car maintenance reads from the Supabase repository.
- `POST /api/maintenance` for create.
- `PATCH` and `DELETE /api/maintenance/:id` for direct management.
- Shared maintenance scheduling helper for next-due calculation and derived status.
- Dialog-based create/edit/delete management on the maintenance route.
- Maintenance-to-entries deep links that prefill `/entries` for linked service logging.

### Out Of Scope
- Reminder delivery or background jobs.
- Cross-user shared maintenance templates.
- Dashboard maintenance alerts and any shared mock-to-real maintenance selector convergence outside the maintenance route.

## 5. Constraints And Assumptions
- Technical constraints:
  - due state should not drift from canonical `next_due_*` fields plus the current car mileage,
  - route handlers should stay thin and delegate business logic into shared helpers and repository seams,
  - entry-linked completion must remain consistent with the transactional entry workflow from `T007`,
  - Postgres `DATE` values must be normalized back to `YYYY-MM-DD` strings before domain helpers touch them.
- Product constraints:
  - the due/overdue ordering users see today must remain intelligible after migration,
  - the maintenance route must stay mobile-first and dialog-driven.
- Assumptions:
  - maintenance `status` should be treated as server-derived output, not client-authored input,
  - direct maintenance management does not replace entry-linked service logging for recurring schedule completion,
  - the shared mock facade can remain in place for dashboard and other domains during this task.

## 6. Architecture And Design
- Affected layers/modules:
  - `app/(app)/maintenance/page.tsx`
  - `app/api/maintenance/route.ts`
  - `app/api/maintenance/[id]/route.ts`
  - `components/maintenance/maintenance-view.tsx`
  - `components/maintenance/maintenance-form.tsx`
  - `lib/db/maintenance-scheduling.ts`
  - `lib/db/maintenance-form.ts`
  - `lib/db/maintenance-api.ts`
  - `lib/db/supabase/data-access.ts`
  - `app/(app)/entries/page.tsx`
  - `components/entries/entry-log-view.tsx`
- Data model changes:
  - no schema migration was required; the existing maintenance table, ownership, and RLS were sufficient,
  - reads derive effective status from canonical due fields plus the selected car mileage,
  - create/update writes recompute `next_due_*` and persist the derived status,
  - row mappers normalize date-only DB values into `YYYY-MM-DD` strings before domain logic runs.
- Auth/security impact:
  - every maintenance read and mutation is scoped through the owning car and active Better Auth user,
  - delete treats missing and foreign ids the same way with `404`,
  - maintenance-to-entry deep links only preselect owned rows already loaded for the selected car.
- Mobile-first UX approach:
  - keep the maintenance list scannable on phone widths with stable priority ordering,
  - keep create/edit in dialogs rather than forcing route changes,
  - use explicit destructive confirmation and route-to-route deep links instead of hidden overflow actions.

## 7. Implementation Steps
1. Cut over `/maintenance` to a server-loaded feature route:
   - load owned cars from `getServerDataAccess()`
   - resolve the selected car from `?car=`
   - load per-car maintenance items from the real repository
   - keep the empty state on the route when no cars exist
2. Add a shared scheduling seam:
   - compute next due mileage/date on create and edit
   - derive due state from canonical due fields plus current mileage/date
   - sort items by derived status and due priority
3. Add server-owned route mutations:
   - `POST /api/maintenance`
   - `PATCH /api/maintenance/:id`
   - `DELETE /api/maintenance/:id`
   - keep payload parsing and user-safe error serialization in framework-light helpers
4. Refactor the maintenance UI:
   - make `MaintenanceView` prop-driven
   - extract a reusable `MaintenanceForm`
   - add dialog-driven edit and delete flows
   - keep car switching URL-driven through `?car=`
5. Converge maintenance service completion with `/entries`:
   - add “Log Service” deep links from maintenance items
   - let `/entries` honor `maintenance=<itemId>&mode=service`
   - reset those prefill params after successful entry submission
6. Fix any real migration bugs at the root:
   - when QA revealed `DATE` rows arriving as `Date` objects, normalize them in the mapper seam instead of weakening the scheduling helpers or UI.

## 8. Test Plan
- Unit tests:
  - due-state derivation
  - next-due recalculation helpers
  - create/update payload builders for the maintenance form
- Integration tests:
  - read ordering and owner scoping
  - create/update/delete success and auth scope failures
  - derived status behavior on real maintenance rows
  - entry-linked service completion behavior through the existing `/entries` workflow
- E2E/smoke tests:
  - add maintenance item
  - edit maintenance item
  - delete maintenance item
  - use “Log Service” and complete a maintenance item through the entry-linked flow
- Regression tests:
  - maintenance list remains readable and operable on small screens
  - mappers preserve date-only semantics for maintenance and todo rows

## 9. QA Plan
- Responsive breakpoints to validate:
  - 320x568
  - 375x812
  - 768x1024
  - 1024x768
- Accessibility checks:
  - maintenance form labels
  - list status communication not based on color alone
  - keyboard access to add/edit/delete flows
- Manual user flows:
  - create maintenance item
  - update intervals and last-done values
  - delete with cancel and confirm
  - verify derived due ordering
  - deep-link into `/entries` and complete a linked service entry
  - verify the maintenance item returns as `upcoming` with recalculated due fields

## 10. Rollout And Rollback
- Rollout plan:
  - ship the maintenance route migration as one bounded route-level cutover
  - keep dashboard and other shared maintenance surfaces on the mock facade
  - converge route-to-route service completion onto `/entries` rather than adding a duplicate mutation path
- Rollback plan:
  - point `/maintenance` back to the mock facade if the real route behavior regresses
  - disable the maintenance API routes if due-state or ownership logic is incorrect
  - revert the maintenance deep-link behavior in `/entries` if route convergence causes user confusion
- Monitoring plan:
  - due-state calculation failures
  - maintenance route mutation failures
  - entry-linked completion errors from maintenance-originated flows

## 11. Risks And Mitigations
- Risk: persisted `status` becomes stale.
- Mitigation: derive `status` from canonical fields where possible instead of trusting manual updates.
- Risk: maintenance completion and entry writes diverge.
- Mitigation: route completion linkage only through the transactional entry workflow.
- Risk: DB date-only columns arrive in runtime code as `Date` objects and break local-date helpers.
- Mitigation: normalize date-only row fields in the mapper seam and add regression coverage at the mapper level.
- Risk: a reads-only maintenance migration would leave the feature incoherent because create/edit/delete are route-local.
- Mitigation: fold create into `T008` and finish direct management in `T008A` instead of forcing an artificial split.

## 12. Acceptance Criteria
- [x] `/maintenance` reads use Supabase with stable derived due-state ordering.
- [x] Maintenance create uses a server-owned mutation boundary.
- [x] Maintenance edit/delete use server-owned mutation boundaries with owner scoping.
- [x] Scheduling recalculation runs from canonical fields instead of trusting client-authored status.
- [x] “Log Service” on maintenance items converges onto the existing `/entries` workflow.
- [x] Dashboard and other shared mock facades remain intentionally transitional.

## 13. Definition Of Done Check
- [x] Code complete
- [x] Tests complete
- [x] Docs/plans updated
- [x] Quality gates passed
