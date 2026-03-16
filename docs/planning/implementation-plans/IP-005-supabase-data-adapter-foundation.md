# IP-005: Supabase Data Adapter Foundation

## Metadata
- Task ID: `T005`, `T005A`, `T005B`, `T010`, `T011`, `T017`
- Title: Data Access Layer Refactor (Repository Contracts + Supabase Adapter Seam)
- Priority: `P0`
- Owner: AI pair session with user
- Status: `draft`
- Related backlog item: `T005`

## 1. Problem Statement
[`lib/db/api.ts`](/Users/mounish/workspace/projects/car-expense/carnitis/lib/db/api.ts) is a single mock module that exposes every domain operation and also owns multi-entity business side effects. UI components import it directly across dashboard, cars, entries, maintenance, and todos. A direct swap from this file to Supabase queries would create an unreviewable migration and make security, validation, and error handling inconsistent.

## 2. Goals
- Replace the monolithic mock API with explicit repository and service seams.
- Establish RLS-safe table ownership and row-to-domain mapping before feature screens switch to Supabase.
- Standardize validation, typed errors, and logging at the server boundary.
- Keep reads and writes separable so migration can ship in small PRs.

## 3. Non-Goals
- No full feature migration in this foundation phase.
- No chart redesign or dashboard UX rewrite.
- No bypass of domain services from page components.

## 4. Scope
### In Scope
- Domain repository contracts and adapter structure.
- Base schema/RLS strategy for cars, entries, maintenance, and todos.
- Shared row mappers, query helpers, validation, and error normalization.
- Shared logging and safe user-facing failure patterns.

### Out Of Scope
- Final domain-specific query details for every screen.
- New product features unrelated to migration.
- Direct client-side Supabase access for sensitive multi-table mutations.

## 5. Constraints And Assumptions
- Technical constraints:
  - user-owned data must be protected by RLS,
  - entry creation currently updates cars, maintenance items, and todos in one flow,
  - Supabase query builder alone is not enough for safe multi-table transactional writes.
- Product constraints:
  - the UI should keep working while each domain is migrated independently.
- Assumptions:
  - simple reads and isolated CRUD can use shared Supabase helpers,
  - cross-entity writes will use a server-side transactional workflow, most likely a Postgres function or another controlled server execution path.

## 6. Architecture And Design
- Affected layers/modules:
  - `lib/db/api.ts` split into domain modules or service/repository packages
  - shared `lib/db/errors.ts`, mapper utilities, and validation modules
  - `supabase/migrations/*` for tables, indexes, and policies
- Data model changes:
  - add explicit ownership columns and indexes
  - define app profile/user foreign key relationships consistently
  - derive or recompute aggregates instead of trusting client-side updates
- Auth/security impact:
  - every domain query must be user-scoped
  - service-role or direct DB access stays server-only
  - user-facing errors must not leak SQL, token, or policy details
- Mobile-first UX approach:
  - loading, empty, and failure states remain explicit during phased migration
  - server validation errors map cleanly to existing forms on small screens

## 7. Implementation Steps
1. Define repository seams:
   - split cars, entries, maintenance, todos into distinct server-side modules
   - preserve public domain contracts where possible
   - introduce an adapter factory so mock and Supabase implementations can coexist during rollout
2. Land schema and policy foundation:
   - create baseline tables, ownership, indexes, and RLS policies
   - document rollback for every migration affecting auth or ownership
3. Add shared mapping and validation:
   - row-to-domain mappers
   - zod schemas for mutation inputs
   - normalization helpers for known failure modes
4. Add error handling and observability:
   - typed service errors
   - structured logging without secrets or PII-heavy payloads
   - consistent UI-safe error messages
5. Define transactional write strategy:
   - isolate entry-linked aggregate updates, maintenance completion, and todo completion behind one server-side workflow

## 8. Test Plan
- Unit tests:
  - row mappers
  - zod validation schemas
  - error normalization utilities
- Integration tests:
  - repository methods for success, auth scope failure, and expected not-found paths
  - RLS behavior for user-owned data
  - transactional write wrapper failure behavior
- E2E/smoke tests:
  - protected read and write paths against a seeded local database
- Regression tests:
  - client forms continue surfacing validation and service failures correctly

## 9. QA Plan
- Responsive breakpoints to validate:
  - 320x568
  - 375x812
  - 768x1024
  - 1024x768
- Accessibility checks:
  - error summaries and inline messages remain screen-reader accessible
  - loading and empty states remain clear
- Manual user flows:
  - a signed-in user cannot access another user's records
  - validation failures render actionable messages
  - domain screens keep functioning when some domains are still mock-backed

## 10. Rollout And Rollback
- Rollout plan:
  - land shared data seams first
  - migrate one domain at a time
  - keep mock adapters available until each Supabase path is verified
- Rollback plan:
  - switch a domain back to the mock adapter if its Supabase implementation regresses
  - revert migrations in reverse order with documented data impact
- Monitoring plan:
  - query failures
  - authorization failures
  - transactional mutation failures

## 11. Risks And Mitigations
- Risk: a single migration PR mixes schema, auth, domain logic, and UI changes.
- Mitigation: enforce separate tasks for platform, repository foundation, and each domain.
- Risk: aggregates become incorrect when multiple writes race.
- Mitigation: move aggregate updates into one server-side transactional workflow.
- Risk: RLS passes in one path but is bypassed elsewhere.
- Mitigation: centralize repository access and add authorization tests per domain.

## 12. Acceptance Criteria
- [ ] The app has explicit domain repository seams for cars, entries, maintenance, and todos.
- [ ] Baseline tables and RLS are defined before domain UIs switch to Supabase.
- [ ] Validation and error normalization happen at shared server boundaries.
- [ ] Transactional cross-entity mutations have a documented implementation path.

## 13. Definition Of Done Check
- [ ] Code complete
- [ ] Tests complete
- [ ] Docs/plans updated
- [ ] Quality gates passed
