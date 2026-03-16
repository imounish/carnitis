# IP-006: Cars Domain Migration To Supabase

## Metadata
- Task ID: `T006`, `T006A`
- Title: Cars Domain Reads And Mutations Migration
- Priority: `P1`
- Owner: AI pair session with user
- Status: `draft`
- Related backlog item: `T006`

## 1. Problem Statement
Cars are the root aggregate for nearly every product surface. [`getCars`](/Users/mounish/workspace/projects/car-expense/carnitis/lib/db/api.ts) and [`getCarById`](/Users/mounish/workspace/projects/car-expense/carnitis/lib/db/api.ts) feed dashboard and detail views, while car creation is used by [`components/cars/add-car-form.tsx`](/Users/mounish/workspace/projects/car-expense/carnitis/components/cars/add-car-form.tsx). This domain is the cleanest first migration because it does not require cross-table transactional logic to ship basic reads and CRUD.

## 2. Goals
- Move car list and detail reads to Supabase first.
- Migrate create, update, and delete after read paths are stable.
- Preserve the existing domain shape used across the UI.

## 3. Non-Goals
- No entry, maintenance, or todo migration in this task.
- No redesign of car detail UX.

## 4. Scope
### In Scope
- Cars table, ownership, indexes, and RLS.
- Car list and detail repository methods.
- Car create, update, and delete repository methods.
- Validation for car form inputs.

### Out Of Scope
- Derived stats that depend on entries or other domains unless explicitly isolated.
- File upload/storage for car images beyond existing field handling.

## 5. Constraints And Assumptions
- Technical constraints: cars are referenced by every other domain, so their ids and ownership rules must stabilize early.
- Product constraints: all current screens that need car selection should continue working while downstream domains remain mock-backed.
- Assumptions: a hybrid adapter phase is acceptable where car data is real but downstream lists may still be mock-backed.

## 6. Architecture And Design
- Affected layers/modules:
  - cars repository
  - cars row mapper
  - add/edit form validation
  - screens using car list and detail data
- Data model changes:
  - `cars.user_id` ownership column
  - indexes for ownership and updated-at sorting
- Auth/security impact:
  - every read and mutation must be scoped to the signed-in user
- Mobile-first UX approach:
  - add/edit forms keep current ergonomics and keyboard behavior on phone widths

## 7. Implementation Steps
1. Add the cars schema and RLS foundation.
2. Migrate read paths:
   - list view
   - detail lookup
   - shared car selectors used by other domains
3. Migrate mutations:
   - create
   - update
   - delete with ownership checks
4. Verify hybrid behavior while other domains still use mock data.

## 8. Test Plan
- Unit tests:
  - car input validation
  - row mapping
- Integration tests:
  - user-scoped list/detail reads
  - create/update/delete success and not-found/unauthorized cases
- E2E/smoke tests:
  - add car
  - view car detail
  - delete or edit car where supported
- Regression tests:
  - forms preserve existing validation behavior and focus management

## 9. QA Plan
- Responsive breakpoints to validate:
  - 320x568
  - 375x812
  - 768x1024
  - >=1280
- Accessibility checks:
  - labeled car form fields
  - visible error states
  - keyboard submission and focus return
- Manual user flows:
  - create first car
  - browse car list
  - open car detail
  - edit and delete a car

## 10. Rollout And Rollback
- Rollout plan:
  - ship reads first, then mutations
  - keep downstream domains on mock adapters until their migrations land
- Rollback plan:
  - switch the cars repository back to the mock adapter
  - revert car-specific migrations if necessary
- Monitoring plan:
  - failed car reads
  - failed create/update/delete mutations

## 11. Risks And Mitigations
- Risk: other domains still expect mock car data timing and defaults.
- Mitigation: preserve the current domain type and sort behavior during the hybrid phase.
- Risk: deleting cars breaks downstream references.
- Mitigation: define delete behavior and foreign key strategy before enabling real deletes.

## 12. Acceptance Criteria
- [ ] Cars list and detail reads use Supabase.
- [ ] Car create, update, and delete use Supabase with validation and ownership checks.
- [ ] Existing car-dependent screens still function while non-car domains remain transitional.

## 13. Definition Of Done Check
- [ ] Code complete
- [ ] Tests complete
- [ ] Docs/plans updated
- [ ] Quality gates passed
