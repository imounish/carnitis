# Carnitis Task Backlog

This is the single source of truth for planned implementation work in `carnitis`.

## Usage
- Status values: `todo`, `in_progress`, `blocked`, `done`.
- Priority values: `P0` (must), `P1` (high), `P2` (medium), `P3` (nice-to-have).
- Every task must have:
  - clear scope,
  - acceptance criteria,
  - a linked implementation plan file under `docs/planning/implementation-plans/` before coding starts.

## Backlog

| ID | Title | Priority | Status | Depends On | Plan |
|---|---|---|---|---|---|
| T001 | Auth + Onboarding UX Foundation (mock service boundary, Better Auth-ready) | P0 | done | - | `IP-001-auth-onboarding-foundation.md` |
| T002 | Better Auth Core Integration for App Authentication | P0 | done | T001, T003A | `IP-002-better-auth-app-auth.md` |
| T002A | Server-side Route Protection + Session-aware App Shell | P0 | done | T002 | `IP-002-better-auth-app-auth.md` |
| T003 | Supabase Local Platform + Environment Contract (local Docker-first) | P0 | done | - | `IP-003-supabase-platform-foundation.md` |
| T003A | Better Auth Database Wiring + Runtime Env Contract | P0 | done | T003 | `IP-003-supabase-platform-foundation.md` |
| T004 | Social Login Integration (Google first via Better Auth) | P1 | done | T002 | `IP-002-better-auth-app-auth.md` |
| T005 | Data Access Layer Refactor (repository contracts + Supabase adapter seam) | P0 | done | T002, T003A | `IP-005-supabase-data-adapter-foundation.md` |
| T005A | Supabase Schema Baseline + RLS for User-owned Data | P0 | done | T005 | `IP-005-supabase-data-adapter-foundation.md` |
| T005B | Domain Row Mappers + Server Data Utilities | P0 | done | T005A | `IP-005-supabase-data-adapter-foundation.md` |
| T006 | Cars Domain Reads + Create Migration to Supabase | P1 | done | T005B | `IP-006-cars-domain-supabase-migration.md` |
| T006A | Cars Update/Delete Mutations + Detail Follow-up | P1 | done | T006, T010 | `IP-006-cars-domain-supabase-migration.md` |
| T007 | Entries Feature Full Cutover (reads + writes + in-feature linkage) | P0 | done | T005B, T006, T006A, T010 | `IP-007-entries-domain-supabase-migration.md` |
| T007A | Entry Write Flows + Car Aggregate Synchronization | P0 | done | T007 | `IP-007-entries-domain-supabase-migration.md` |
| T008 | Maintenance Route Reads + Create Cutover To Supabase | P1 | done | T005B, T006 | `IP-008-maintenance-domain-supabase-migration.md` |
| T008A | Maintenance Edit/Delete + Scheduling Recalculation | P1 | done | T008, T010 | `IP-008-maintenance-domain-supabase-migration.md` |
| T008B | Maintenance Route Convergence With Entry-linked Service Logging | P1 | done | T008A, T007 | `IP-008-maintenance-domain-supabase-migration.md` |
| T009 | Todo Domain Reads + CRUD in Supabase | P1 | done | T005B, T006 | `IP-009-todos-domain-supabase-migration.md` |
| T009A | Todo Route Convergence After Entry-linked Completion | P1 | done | T009, T007 | `IP-009-todos-domain-supabase-migration.md` |
| T010 | Unified Form + Server Boundary Validation (zod) | P1 | done | T002, T005 | `IP-005-supabase-data-adapter-foundation.md` |
| T011 | Error Handling + Observability Baseline (UX-safe failures) | P1 | done | T002, T005 | `IP-005-supabase-data-adapter-foundation.md` |
| T012 | Accessibility Hardening Pass (WCAG AA focus) | P0 | todo | T001 | TBD |
| T013 | UX Consistency Pass (navigation, empty states, progressive disclosure) | P2 | todo | T001 | TBD |
| T013A | Mobile-First Excellence Program (small-screen UX baseline) | P0 | done | T001 | `IP-013A-mobile-first-excellence.md` |
| T014 | Performance Baseline (RSC/client boundaries + bundle audit) | P2 | todo | T005B | TBD |
| T015 | Test Strategy Baseline (unit + integration + smoke e2e for Better Auth + Supabase flows) | P1 | todo | T002, T005B | TBD |
| T015A | Entries Client Form Component Test Coverage | P1 | done | T007 | `IP-015A-entries-client-form-component-tests.md` |
| T016 | CI Quality Gates (typecheck, lint, test, build) | P1 | todo | T015 | TBD |
| T017 | Security and Privacy Baseline (headers, Better Auth session policy, PII handling) | P1 | todo | T002, T005A | `IP-005-supabase-data-adapter-foundation.md` |
| T018 | Seed Data + Dev Experience for local Supabase | P2 | todo | T003, T005A | `IP-003-supabase-platform-foundation.md` |
| T019 | Temporal Data Semantics Audit + Local-Time Display Hardening | P0 | done | T005B, T007 | `IP-019-temporal-data-semantics-and-local-time-hardening.md` |

## Notes
- Auth strategy: Better Auth is the application authentication system. Supabase provides Postgres, Storage, and Realtime; new auth planning should not target Supabase Auth.
- Migration strategy: preserve the public seams in `lib/auth` and `lib/db`, then swap adapters incrementally so reads and writes can ship in separate PRs.
- Data ownership strategy: every user-owned table must carry explicit ownership and RLS before UI paths are switched away from mock data.
- Cross-entity write strategy: entry creation, maintenance completion, and todo completion must run in one server-side transactional workflow; do not scatter those updates across client components.
- Entry-linkage strategy: entry-driven maintenance and todo updates now land in `T007`; later maintenance/todo tasks should converge their standalone routes onto the same real domain state rather than reimplementing the linkage behavior.
- Temporal data strategy: use `DATE`/`YYYY-MM-DD` strings for calendar-day values that must not shift by timezone, and ISO UTC timestamps for real instants; do not mix the two semantics inside shared helpers.
- Maintenance migration strategy: treat maintenance `status` as server-derived output from canonical due fields plus current mileage, not as client-authored business state.
- Plan files should define rollback strategy and manual QA scenarios.
- `T013A` is mandatory and should be considered cross-cutting in all feature work (touch targets, thumb reach, keyboard handling, safe areas, and reduced cognitive load on mobile).
