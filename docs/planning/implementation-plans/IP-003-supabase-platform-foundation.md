# IP-003: Supabase Platform Foundation

## Metadata
- Task ID: `T003`, `T003A`, `T018`
- Title: Supabase Local Platform + Environment Contract
- Priority: `P0`
- Owner: AI pair session with user
- Status: `draft`
- Related backlog item: `T003`

## 1. Problem Statement
The repository has only a minimal [`supabase/config.toml`](/Users/mounish/workspace/projects/car-expense/carnitis/supabase/config.toml). There is no documented runtime contract for Supabase clients, no direct database connection plan for Better Auth, and no local developer workflow for seeding or resetting data. Without this foundation, auth and domain migrations will stall or couple themselves to ad hoc setup.

## 2. Goals
- Establish the local Supabase workflow and environment contract once.
- Provide the runtime pieces needed by both Better Auth and the app data adapters.
- Make local reset, seed, and verification steps explicit before domain data migration begins.

## 3. Non-Goals
- No domain-specific feature migration in this phase.
- No production deployment automation in this phase.
- No direct UI rewrites.

## 4. Scope
### In Scope
- Supabase local development contract and scripts/documentation.
- Server/browser Supabase client helpers.
- Direct database connection contract for Better Auth.
- Seed/reset workflow for local environments.

### Out Of Scope
- RLS policy definitions for every domain table.
- Auth or domain-specific query logic.
- CI orchestration beyond what later tasks require.

## 5. Constraints And Assumptions
- Technical constraints: Better Auth requires a direct database connection; browser-facing app reads and writes use Supabase clients with publishable credentials.
- Product constraints: local development must remain simple enough for small, incremental PRs.
- Assumptions:
  - local Supabase will be run via Docker-first Supabase CLI workflows,
  - a server-only connection string will be available for Better Auth and transactional server workflows,
  - env validation should fail fast in development.

## 6. Architecture And Design
- Affected layers/modules:
  - `supabase/config.toml`
  - `supabase/migrations/*`
  - `lib/supabase/server.ts`
  - `lib/supabase/client.ts`
  - `lib/supabase/admin.ts` or equivalent server-only helper
  - env validation module
- Data model changes:
  - baseline migration directories and seed conventions
  - Better Auth table placement in the same Postgres instance
- Auth/security impact:
  - server-only keys and DB URLs must never leak into client bundles
  - Better Auth direct DB access and any service-role usage stay on the server
- Mobile-first UX approach:
  - no UI scope, but keep auth and data failures explicit so mobile flows do not degrade silently

## 7. Implementation Steps
1. Define the environment contract:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`
   - direct Postgres connection URL for Better Auth and transactional server work
   - `BETTER_AUTH_URL`
   - `BETTER_AUTH_SECRET`
2. Add shared Supabase helpers:
   - browser client
   - server client
   - server-only privileged helper where strictly necessary
3. Add Better Auth database wiring prerequisites:
   - shared DB connection module for Better Auth
   - documented startup order for local Supabase and auth migrations
4. Define local DX and seeds:
   - reset flow
   - seed flow
   - smoke verification for auth route and base data access

## 8. Test Plan
- Unit tests:
  - env parsing and validation helpers
- Integration tests:
  - server/browser client creation under valid env
  - local reset/seed helpers where automated
- E2E/smoke tests:
  - app boots against local Supabase config
  - Better Auth health endpoint or equivalent auth route smoke
- Regression tests:
  - missing env fails fast with actionable messages

## 9. QA Plan
- Responsive breakpoints to validate:
  - not UI-focused; verify auth and data error surfaces remain understandable on small screens when env is missing
- Accessibility checks:
  - not primary scope
- Manual user flows:
  - start local Supabase
  - run migrations
  - seed base data
  - boot app successfully against local env

## 10. Rollout And Rollback
- Rollout plan:
  - land env validation and shared clients first
  - add migration and seed docs next
  - unblock Better Auth and domain tasks after local smoke passes
- Rollback plan:
  - revert env validation and helper introduction together
  - keep previous mock-only local workflow available until auth and data migrations are stable
- Monitoring plan:
  - record startup failures, env parse failures, and local migration drift

## 11. Risks And Mitigations
- Risk: direct DB credentials leak into client code.
- Mitigation: isolate direct connection access in server-only modules and review imports carefully.
- Risk: local setup becomes inconsistent across tasks.
- Mitigation: make `T003` the required prerequisite for auth and domain migrations.
- Risk: seed data diverges from domain contracts.
- Mitigation: keep seed scripts using the same server-side domain boundaries where feasible.

## 12. Acceptance Criteria
- [ ] Local Supabase workflow is documented and repeatable.
- [ ] The app has shared server/browser Supabase helpers with validated env input.
- [ ] Better Auth has a documented and implemented direct DB connection contract.
- [ ] Reset and seed steps exist for local development.

## 13. Definition Of Done Check
- [ ] Code complete
- [ ] Tests complete
- [ ] Docs/plans updated
- [ ] Quality gates passed
