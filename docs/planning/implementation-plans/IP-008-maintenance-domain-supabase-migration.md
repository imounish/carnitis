# IP-008: Maintenance Domain Migration To Supabase

## Metadata
- Task ID: `T008`, `T008A`, `T008B`
- Title: Maintenance Reads, Mutations, And Entry Linkage Migration
- Priority: `P1`
- Owner: AI pair session with user
- Status: `draft`
- Related backlog item: `T008`

## 1. Problem Statement
Maintenance data is currently simple mock state, but its due-status behavior is more subtle than raw CRUD. The current domain stores `next_due_*` fields and a persisted `status`, while entry writes can mark a maintenance item as completed and recalculate the next due milestone. That logic needs to become explicit before migration.

## 2. Goals
- Move maintenance reads into Supabase with reliable due-state behavior.
- Support maintenance create and update flows independently from entry-linked completion.
- Keep maintenance completion linkage as a separate follow-on task after base mutation behavior is stable.

## 3. Non-Goals
- No calendar or notification system.
- No redesign of maintenance prioritization UX.

## 4. Scope
### In Scope
- Maintenance table, indexes, ownership, and RLS.
- Read queries for per-car and upcoming maintenance views.
- Maintenance create/update mutations with due-field recalculation.
- Entry-linked completion updates in a dependent task.

### Out Of Scope
- Reminder delivery or background jobs.
- Cross-user shared maintenance templates.

## 5. Constraints And Assumptions
- Technical constraints:
  - due state should not drift from the canonical next-due fields,
  - entry-linked completion must remain consistent with the transactional entry workflow.
- Product constraints:
  - the due/overdue ordering users see today must remain intelligible after migration.
- Assumptions:
  - maintenance `status` may be derived in queries or views from `next_due_*` fields plus current mileage/date, even if the domain contract still exposes `status`,
  - maintenance completion from entry creation will be layered on only after reads and direct mutations are stable.

## 6. Architecture And Design
- Affected layers/modules:
  - maintenance repository/service
  - due-state mapper or query helper
  - maintenance form validation
- Data model changes:
  - ownership aligned with cars
  - query support for due ordering
  - recalculation logic for `last_done_*` and `next_due_*`
- Auth/security impact:
  - every maintenance query and mutation is scoped through the owning car
- Mobile-first UX approach:
  - maintenance lists should stay scannable on phone widths with stable priority ordering

## 7. Implementation Steps
1. Add maintenance schema, indexes, and RLS.
2. Implement read paths:
   - by car
   - upcoming maintenance across cars
   - derived due-state ordering
3. Implement direct mutations:
   - create maintenance item
   - update maintenance item
   - recalculate next-due fields when intervals or completion data change
4. Add entry-linked completion handling in a dependent task:
   - update last-done fields from entry writes
   - recalculate next due values

## 8. Test Plan
- Unit tests:
  - due-state derivation
  - next-due recalculation helpers
- Integration tests:
  - read ordering
  - create/update success and auth scope failures
  - entry-linked completion behavior after `T007A`
- E2E/smoke tests:
  - add maintenance item
  - view due/overdue ordering
  - complete a maintenance item through an entry-linked flow
- Regression tests:
  - maintenance list remains readable and operable on small screens

## 9. QA Plan
- Responsive breakpoints to validate:
  - 320x568
  - 375x812
  - 768x1024
  - >=1280
- Accessibility checks:
  - maintenance form labels
  - list status communication not based on color alone
  - keyboard access to add/edit flows
- Manual user flows:
  - create maintenance item
  - update intervals
  - verify due ordering
  - complete via linked entry

## 10. Rollout And Rollback
- Rollout plan:
  - reads first
  - then direct mutations
  - then entry-linked completion
- Rollback plan:
  - switch the maintenance repository back to mock behavior if due-state logic regresses
  - revert maintenance-specific migrations and linkage logic together
- Monitoring plan:
  - due-state calculation failures
  - entry-linked completion errors

## 11. Risks And Mitigations
- Risk: persisted `status` becomes stale.
- Mitigation: derive `status` from canonical fields where possible instead of trusting manual updates.
- Risk: maintenance completion and entry writes diverge.
- Mitigation: route completion linkage only through the transactional entry workflow.

## 12. Acceptance Criteria
- [ ] Maintenance reads use Supabase with stable due-state ordering.
- [ ] Maintenance create/update flows recalculate next due data correctly.
- [ ] Entry-linked maintenance completion works only after the base entry write path is stable.

## 13. Definition Of Done Check
- [ ] Code complete
- [ ] Tests complete
- [ ] Docs/plans updated
- [ ] Quality gates passed
