# IP-009: Todo Domain Migration To Supabase

## Metadata
- Task ID: `T009`, `T009A`
- Title: Todo Reads, CRUD, And Entry Linkage Migration
- Priority: `P1`
- Owner: AI pair session with user
- Status: `draft`
- Related backlog item: `T009`

## 1. Problem Statement
Todos are simpler than entries and maintenance, but the current domain still includes linked completion behavior when an entry references a todo. The migration should keep base CRUD independent from that linkage so the todo surface can move to Supabase without waiting on the full transactional entry workflow.

## 2. Goals
- Move todo reads and direct CRUD operations to Supabase first.
- Preserve current sorting and status behavior.
- Layer entry linkage only after transactional entry writes are stable.

## 3. Non-Goals
- No notifications or reminders in this phase.
- No bulk edit workflow expansion.

## 4. Scope
### In Scope
- Todo table, indexes, ownership, and RLS.
- Per-car and all-active todo reads.
- Create and update mutations.
- Entry-linked status updates in a dependent task.

### Out Of Scope
- Workflow automation beyond current linked-entry behavior.
- New prioritization features.

## 5. Constraints And Assumptions
- Technical constraints:
  - todo completion may be direct or entry-linked,
  - linked entry ids must remain consistent when an entry completes a todo.
- Product constraints:
  - sorting by status and priority should remain familiar during migration.
- Assumptions:
  - direct todo CRUD can ship before entry-linked completion,
  - linked completion will be handled inside the same server-side workflow used by entry writes.

## 6. Architecture And Design
- Affected layers/modules:
  - todo repository/service
  - todo validation
  - todo sorting mapper
- Data model changes:
  - ownership aligned with cars
  - indexes for active status and car lookups
- Auth/security impact:
  - todo queries and writes must be scoped to the signed-in user
- Mobile-first UX approach:
  - preserve fast inline task management on mobile screens

## 7. Implementation Steps
1. Add todo schema, indexes, and RLS.
2. Implement reads:
   - todos by car
   - active todos across cars
   - current sorting rules by status and priority
3. Implement direct mutations:
   - create todo
   - update todo status and fields
4. Add entry-linked completion:
   - set `linked_entry_id`
   - mark status complete
   - set `completed_at`

## 8. Test Plan
- Unit tests:
  - todo validation
  - status/priority sorting helpers if isolated
- Integration tests:
  - per-car and cross-car reads
  - create/update success and auth scope failures
  - entry-linked completion after `T007A`
- E2E/smoke tests:
  - create todo
  - update todo status
  - complete todo via linked entry
- Regression tests:
  - todo lists remain usable and readable across mobile breakpoints

## 9. QA Plan
- Responsive breakpoints to validate:
  - 320x568
  - 375x812
  - 768x1024
  - 1024x768
- Accessibility checks:
  - todo controls have clear labels
  - status changes are announced clearly
  - priority is not communicated by color only
- Manual user flows:
  - add todo
  - update todo status directly
  - complete a todo from entry logging

## 10. Rollout And Rollback
- Rollout plan:
  - reads first
  - then direct CRUD
  - then entry-linked completion
- Rollback plan:
  - revert the todo repository to mock behavior if status linkage regresses
  - revert todo-specific migrations and linkage logic together
- Monitoring plan:
  - todo mutation failures
  - linked-entry completion failures

## 11. Risks And Mitigations
- Risk: entry-linked completion updates todo state without verifying ownership.
- Mitigation: keep linked completion inside the same server-side guarded workflow as entry writes.
- Risk: active todo sorting changes unexpectedly.
- Mitigation: preserve current status and priority ordering explicitly in repository tests.

## 12. Acceptance Criteria
- [ ] Todo reads and direct CRUD use Supabase.
- [ ] Sorting by status and priority remains stable.
- [ ] Entry-linked completion updates todo state safely after the entry write path is live.

## 13. Definition Of Done Check
- [ ] Code complete
- [ ] Tests complete
- [ ] Docs/plans updated
- [ ] Quality gates passed
