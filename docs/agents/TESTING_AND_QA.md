# Testing And QA Standards

## 1. Core Rule
Every code change must include tests, unless the change is documentation-only.

## 2. Test Pyramid Expectations
- Unit tests: business logic, formatters, validators, pure utilities.
- Integration tests: component behavior, route-level interactions, data/service integration points.
- End-to-end smoke tests: critical user flows (auth, car creation, entry logging, todo completion).

## 3. Minimum Tests By Change Type
- UI component change: interaction + rendering assertions, including error/empty states.
- Form change: validation tests (valid, invalid, edge cases) + submit behavior.
- Service/data change: success path, failure path, authorization/data-scope checks.
- Bug fix: regression test reproducing the original failure.
- Repository or schema change: add at least one local-database integration check when the project has a reproducible local backend, and verify cross-user scoping explicitly.
- Destructive mutation change: add ownership checks and, when foreign keys cascade, a local-database verification path that confirms related rows are removed or detached as designed.
- For transactional multi-table workflows, DB-backed integration tests are mandatory. Unit tests are not enough to catch FK, timestamp, or rollback behavior.
- When a route also performs payload normalization, add separate coverage that the underlying repository/service seam still rejects invalid direct calls.

## 4. Test Stack Guidance
If not already configured in the touched area, establish a baseline stack:
- Unit/Integration: Vitest + Testing Library
- Network mocking: MSW (or equivalent)
- E2E smoke: Playwright

Add scripts to `package.json` when introducing test infrastructure:
- `test`
- `test:unit`
- `test:integration`
- `test:e2e` (when applicable)
- When adding client-form component coverage, prefer freezing only `Date` instead of all timers so user-event and mocked network behavior stay realistic.

## 5. Quality Gates
Run what applies:
- `npm run lint`
- `npx tsc --noEmit`
- relevant test command(s)
- `npm run build` for deployment-impacting changes
- When local Supabase is available, rerun the integration suite against the real local database instead of accepting sandbox skips as sufficient completion.

## 6. Mobile-First QA Matrix
At minimum validate on:
- 320x568 (small phone)
- 375x812 (common phone)
- 768x1024 (tablet portrait)
- 1024x768 (tablet/desktop boundary)
- >=1280 desktop

Validate:
- layout stability,
- touch target sizes,
- keyboard interaction,
- form usability with virtual keyboard,
- visible focus states and readable contrast.

## 7. Release Risk Checks
For each PR, explicitly state:
- what could break,
- where rollback is needed,
- whether data migration/security behavior changed.

## 8. Learnings From Recent Supabase Work
- Do not use semicolon-separated multi-statement cleanup SQL with `pg` prepared queries in integration tests. Execute one statement per query or use a helper that does so.
- When result ordering depends on timestamps, make test fixtures deterministic with explicit `created_at` values instead of relying on insertion order within a multi-row insert.
- If local DB tests surface a schema/design issue, stop implementation, return briefly to planning, and fix the underlying schema rather than weakening the test to fit the bug.
- Client-side submit/reset/refresh flows should have at least one component-level automated regression test when they drive critical product workflows.
- For temporal logic, add direct regression coverage for date-only parsing, explicit-timezone timestamp formatting, and end-of-month month-add behavior. Do not rely on the machine timezone or implicit JavaScript date parsing in tests.
- When migrating a route-owned CRUD flow, include at least one interactive QA pass that exercises route-to-route deep links, success refresh behavior, and destructive-dialog keyboard focus.
- When DB-backed QA reveals a row-mapper shape mismatch, add a mapper-level regression test for the raw driver shape instead of only asserting the downstream UI symptom.
