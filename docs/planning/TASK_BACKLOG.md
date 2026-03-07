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
| T001 | Auth + Onboarding Foundation (mock-first, Supabase-ready) | P0 | todo | - | `IP-001-auth-onboarding-foundation.md` |
| T002 | Route Protection + Session-aware App Shell | P0 | todo | T001 | TBD |
| T003 | Supabase Client + Environment Contract (local Docker-first) | P0 | todo | T001 | TBD |
| T004 | Social Login Integration (Google first, extensible providers) | P1 | todo | T001, T003 | TBD |
| T005 | Data Access Layer Refactor (API interfaces + adapters) | P0 | todo | T003 | TBD |
| T006 | Cars Domain Migration to Supabase (CRUD + validations) | P1 | todo | T005 | TBD |
| T007 | Entries Domain Migration to Supabase (fuel/service/expense flows) | P1 | todo | T005 | TBD |
| T008 | Maintenance Domain Migration to Supabase | P1 | todo | T005 | TBD |
| T009 | Todos Domain Migration to Supabase | P1 | todo | T005 | TBD |
| T010 | Unified Form Validation (zod schemas + shared parsing) | P1 | todo | T005 | TBD |
| T011 | Error Handling + Observability Baseline (UX-safe failures) | P1 | todo | T005 | TBD |
| T012 | Accessibility Hardening Pass (WCAG AA focus) | P0 | todo | T001 | TBD |
| T013 | UX Consistency Pass (navigation, empty states, progressive disclosure) | P2 | todo | T001 | TBD |
| T014 | Performance Baseline (RSC/client boundaries + bundle audit) | P2 | todo | T005 | TBD |
| T015 | Test Strategy Baseline (unit + integration + smoke e2e) | P1 | todo | T001 | TBD |
| T016 | CI Quality Gates (typecheck, lint, test, build) | P1 | todo | T015 | TBD |
| T017 | Security and Privacy Baseline (headers, auth boundaries, PII handling) | P1 | todo | T001, T003 | TBD |
| T018 | Seed Data + Dev Experience for local Supabase | P2 | todo | T003 | TBD |

## Notes
- Work will proceed incrementally; no broad rewrites.
- The current codebase uses dummy data; migration tasks preserve existing UX first, then switch adapters.
- Plan files should define rollback strategy and manual QA scenarios.
