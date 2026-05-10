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

### Completed

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
| T013A | Mobile-First Excellence Program (small-screen UX baseline) | P0 | done | T001 | `IP-013A-mobile-first-excellence.md` |
| T015A | Entries Client Form Component Test Coverage | P1 | done | T007 | `IP-015A-entries-client-form-component-tests.md` |
| T019 | Temporal Data Semantics Audit + Local-Time Display Hardening | P0 | done | T005B, T007 | `IP-019-temporal-data-semantics-and-local-time-hardening.md` |

### Phase 1 — Production Blockers (P0)

| ID | Title | Priority | Status | Depends On | Plan |
|---|---|---|---|---|---|
| T020 | Dashboard + Shared Surface Supabase Migration | P0 | todo | T005B, T007 | `IP-020-dashboard-supabase-migration.md` |
| T017 | Security + Privacy Baseline (headers, session policy, `ignoreBuildErrors` removal) | P0 | todo | T002, T005A | `IP-017-security-privacy-baseline.md` |
| T021 | Deployment + Hosting Configuration | P0 | todo | T017, T020 | `IP-021-deployment-hosting.md` |

### Phase 2 — Quality & Confidence (P1)

| ID | Title | Priority | Status | Depends On | Plan |
|---|---|---|---|---|---|
| T025 | Fuel Level Before Fill-Up — Partial Fill Range Accuracy | P1 | todo | T007 | `IP-025-fuel-level-before-fill.md` |
| T024 | Codebase Simplification + Code Quality Hardening | P1 | todo | T020 | `IP-024-codebase-simplification.md` |
| T012 | Accessibility Hardening (keyboard nav, contrast, ARIA, focus management) | P1 | todo | T020 | `IP-012-accessibility-hardening.md` |
| T015 | Test Strategy: Integration Write Flows + E2E Smoke | P1 | todo | T020 | `IP-015-test-strategy-baseline.md` |
| T016 | CI Quality Gates (typecheck, lint, test, build via GitHub Actions) | P1 | todo | T015, T017 | `IP-016-ci-quality-gates.md` |
| T014 | Performance Baseline (RSC/client boundaries + bundle audit) | P1 | todo | T020 | `IP-014-performance-baseline.md` |

### Phase 3 — Polish (P2)

| ID | Title | Priority | Status | Depends On | Plan |
|---|---|---|---|---|---|
| T022 | Production Error Monitoring (Sentry or equivalent) | P2 | todo | T021 | `IP-022-error-monitoring.md` |
| T013 | UX Consistency Pass (navigation, empty states, progressive disclosure) | P2 | todo | T020 | `IP-013-ux-consistency.md` |
| T023 | Database Backup + Recovery Documentation | P2 | todo | T021 | `IP-023-backup-recovery.md` |

### Deferred (P3)

| ID | Title | Priority | Status | Depends On | Plan |
|---|---|---|---|---|---|
| T018 | Seed Data + Dev Experience for local Supabase | P3 | todo | T003, T005A | `IP-003-supabase-platform-foundation.md` |

## Critical Path to Production

```
T020 (dashboard migration) ──┐
                              ├──→ T021 (deployment) ──→ PRODUCTION
T017 (security baseline)  ───┘
```

## Task Summaries

### T020: Dashboard + Shared Surface Supabase Migration
The dashboard is the **only remaining route using mock data**. `components/dashboard/dashboard-view.tsx` imports from `lib/db/api.ts` which calls `createMockDataAccess()`. After migration, the entire mock facade (`lib/db/api.ts`, `lib/db/mock/`) can be deleted. `lib/db/stats-service.ts` is already adapter-agnostic.

### T017: Security + Privacy Baseline
Remove `ignoreBuildErrors: true` from `next.config.mjs`. Add security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options). Create `middleware.ts` for edge-level protection. Audit Better Auth session policy (expiry, cookie flags). Verify RLS coverage. Consider rate limiting on auth endpoints.

### T021: Deployment + Hosting Configuration
Git remote setup, hosting platform (Vercel recommended), production Supabase project, environment variables, domain/SSL, successful production build and deployment.

### T025: Fuel Level Before Fill-Up
Add an optional `fuel_level_before` (0–100%) field to fuel entries so the range estimate uses the actual post-fill tank level instead of assuming a full tank. Requires a one-column additive migration, Zod schema update, row mapper update, stats service update (range formula only), and a UI input on the fuel entry form. MPG calculation (full-tank window) is unchanged.

### T024: Codebase Simplification + Code Quality Hardening
Systematic pass to eliminate duplication (~1,300 lines of consolidation potential). Seven sub-tasks:
- **S1**: API route factory — extract shared pattern from 8 near-identical route handlers
- **S2**: Validation primitive consolidation — deduplicate Zod primitives across 3 files
- **S3**: Error payload factory — replace 4 domain-specific payload files with one generic factory
- **S4**: Data access decomposition — split 702-line monolithic `data-access.ts` into 4 domain repositories
- **S5**: Mapper deduplication — consolidate `mapEntryRow()` and number conversion helpers
- **S6**: Dashboard component decomposition — ensure pure presentational component after T020
- **S7**: Dead code cleanup — delete mock facade, unused exports, orphan TODOs

### T012: Accessibility Hardening
Scoped to: keyboard navigation for all CRUD flows, color contrast audit on stat cards/charts, ARIA labels on icon-only buttons, focus management in modals/dialogs. Excludes: complex screen reader testing, WCAG AAA, PDF accessibility.

### T015: Test Strategy Baseline
Scoped to: integration tests for critical write flows (entry creation with car aggregate sync, maintenance completion via entries) + one E2E smoke test (login → dashboard → create entry). Unit layer already has 20+ test files.

### T016: CI Quality Gates
GitHub Actions pipeline with: `npx tsc --noEmit`, `npm run lint`, `npm run test`, `npm run build`. Requires `ignoreBuildErrors` removal from T017.

### T014: Performance Baseline
RSC/client boundary audit (especially post-dashboard migration), bundle size check, ensure no unnecessary client-side JS.

### T022: Production Error Monitoring
Unhandled error reporting (Sentry or equivalent), server action failure tracking, `@vercel/analytics` wiring (already a dependency), no PII in error reports.

### T013: UX Consistency Pass
Navigation, empty states, progressive disclosure across all 6 route pages (dashboard, cars, entries, maintenance, todos, settings).

### T023: Database Backup + Recovery Documentation
Document Supabase backup plan, recovery procedures, test recovery from backup.

## Notes
- Auth strategy: Better Auth is the application authentication system. Supabase provides Postgres, Storage, and Realtime; new auth planning should not target Supabase Auth.
- Data ownership strategy: every user-owned table must carry explicit ownership and RLS before UI paths are switched away from mock data.
- Cross-entity write strategy: entry creation, maintenance completion, and todo completion must run in one server-side transactional workflow; do not scatter those updates across client components.
- Temporal data strategy: use `DATE`/`YYYY-MM-DD` strings for calendar-day values that must not shift by timezone, and ISO UTC timestamps for real instants; do not mix the two semantics inside shared helpers.
- Maintenance migration strategy: treat maintenance `status` as server-derived output from canonical due fields plus current mileage, not as client-authored business state.
- Code quality mandate: code must be simplistic, minimal, follow highest coding standards, meaningful and easy to understand. No duplication. Abstractions must earn their existence.
- Plan files should define rollback strategy and manual QA scenarios.
- `T013A` is mandatory and should be considered cross-cutting in all feature work (touch targets, thumb reach, keyboard handling, safe areas, and reduced cognitive load on mobile).
