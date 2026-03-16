# IP-007: Entries Domain Migration To Supabase

## Metadata
- Task ID: `T007`, `T007A`
- Title: Entries Reads And Transactional Writes Migration
- Priority: `P0`
- Owner: AI pair session with user
- Status: `draft`
- Related backlog item: `T007`

## 1. Problem Statement
Entries are the highest-risk migration point because [`createEntry`](/Users/mounish/workspace/projects/car-expense/carnitis/lib/db/api.ts) does more than insert a row. It updates car mileage and spending totals, and it can also update linked maintenance items and todos. Reads can move independently, but writes must preserve data integrity across multiple tables.

## 2. Goals
- Move entry reads to Supabase without waiting for the full write workflow.
- Introduce a transactional server-side write path for entry creation.
- Keep the `Entry` domain contract stable for UI consumers.

## 3. Non-Goals
- No chart redesign or analytics expansion in this phase.
- No direct client-side multi-table mutation logic.

## 4. Scope
### In Scope
- Entries table, ownership strategy, indexes, and RLS.
- Read paths for car detail and recent entries.
- Entry creation workflow with car aggregate synchronization.
- Validation for fuel, maintenance expense, and maintenance-done entry variants.

### Out Of Scope
- Maintenance and todo linkage behavior beyond the tasks that explicitly depend on `T007A`.
- Advanced reporting features beyond existing stats needs.

## 5. Constraints And Assumptions
- Technical constraints:
  - entry writes must update related tables atomically,
  - car totals and current mileage cannot be trusted to client code,
  - reads and writes should be shippable in separate PRs.
- Product constraints:
  - entry logging is a primary mobile workflow and cannot become slower or more error-prone.
- Assumptions:
  - a server-side transactional function or equivalent controlled workflow will be used for writes,
  - linked maintenance and todo updates can be layered on after base entry writes are stable.

## 6. Architecture And Design
- Affected layers/modules:
  - entries repository/service
  - entry validation schemas
  - transactional mutation wrapper
  - views consuming recent and per-car entry lists
- Data model changes:
  - entry ownership strategy aligned with cars
  - indexes for `car_id`, `date`, and entry-type filtering
  - aggregate update path for car totals and mileage
- Auth/security impact:
  - writes must verify car ownership before mutating anything
  - linked updates must not bypass ownership boundaries
- Mobile-first UX approach:
  - keep entry forms optimized for quick logging on phone screens
  - preserve concise error feedback and submit affordances

## 7. Implementation Steps
1. Add entries schema and RLS foundation.
2. Migrate read paths:
   - entries by car
   - recent entries for dashboards and summaries
3. Add shared entry validation:
   - fuel-specific rules
   - maintenance expense rules
   - maintenance done rules
4. Implement transactional entry create:
   - insert entry
   - update car mileage if needed
   - update per-category totals safely
5. Defer maintenance and todo linkage to dependent tasks once the base write path is stable.

## 8. Test Plan
- Unit tests:
  - entry validation per entry variant
  - aggregate math helpers if isolated
- Integration tests:
  - per-car and recent entry reads
  - entry creation success, validation failure, unauthorized car access, and aggregate update failure handling
- E2E/smoke tests:
  - log fuel entry
  - log maintenance expense entry
  - verify car totals and mileage reflect the write
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
  - verify recent entries ordering
  - verify car totals update

## 10. Rollout And Rollback
- Rollout plan:
  - ship reads first
  - then enable transactional writes
  - then layer maintenance/todo linkages in dependent tasks
- Rollback plan:
  - revert entry writes to mock adapter while keeping reads isolated if necessary
  - revert transactional DB changes if aggregate correctness is at risk
- Monitoring plan:
  - failed entry writes
  - aggregate mismatch signals
  - validation failure rates

## 11. Risks And Mitigations
- Risk: aggregate totals drift from entries over time.
- Mitigation: keep updates server-side and add regression checks around totals and mileage.
- Risk: entry writes block maintenance and todo work.
- Mitigation: define `T007A` as the base write layer and keep linkage in dependent tasks.

## 12. Acceptance Criteria
- [ ] Entry reads use Supabase.
- [ ] Entry creation uses a transactional server-side workflow.
- [ ] Car mileage and totals update correctly from entry writes.
- [ ] Entry forms use shared validation and surface actionable errors.

## 13. Definition Of Done Check
- [ ] Code complete
- [ ] Tests complete
- [ ] Docs/plans updated
- [ ] Quality gates passed
