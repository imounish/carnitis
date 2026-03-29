# IP-015: Test Strategy Baseline

## Metadata
- Task ID: T015
- Title: Test Strategy: Integration Write Flows + E2E Smoke
- Priority: P1
- Status: `draft`
- Related backlog item: T015

## 1. Problem Statement
The project has 20+ unit test files and component tests for entries, but lacks integration tests for critical server-side write flows and has no E2E smoke test. Critical transactional workflows (entry creation → car aggregate sync → maintenance/todo updates) are untested at the integration level.

## 2. Goals
- Integration tests for critical write flows against real local Supabase
- One E2E smoke test covering the core user journey
- Confidence that transactional integrity is maintained

## 3. Non-Goals
- Comprehensive test coverage for all components
- Visual regression testing
- Load/performance testing

## 4. Scope
### In Scope
- Integration tests for:
  - Entry creation with car aggregate synchronization
  - Maintenance completion via entry workflow
  - Todo completion via entry workflow
- E2E smoke test: login → dashboard → create entry
- Test infrastructure: Playwright setup for E2E

### Out Of Scope
- Component tests for every component (T015A covered entries)
- Unit tests for utilities (already covered)
- CI integration (see T016)

## 5. Acceptance Criteria
- [ ] Integration tests for entry creation + car aggregate sync pass
- [ ] Integration tests for maintenance completion via entries pass
- [ ] Integration tests for todo completion via entries pass
- [ ] E2E smoke test: sign-in → dashboard → log fuel entry passes
- [ ] Test scripts documented in package.json
