# IP-015A: Entries Client Form Component Test Coverage

## Metadata
- Task ID: `T015A`
- Title: Entries Client Form Component Test Coverage
- Priority: `P1`
- Status: `completed`

## Summary
The repo had strong Node-based unit/integration coverage but no component-level harness for client UI flows. `T015A` added a focused `Vitest + Testing Library + MSW` baseline and used it to cover the missing success path in `EntryLogView`.

## What Changed
- Added a component-test runner with `jsdom`.
- Added shared setup for network mocking and browser/test-environment gaps.
- Added regression coverage for:
  - fuel submit success,
  - maintenance-done submit success with advanced section open,
  - success toast,
  - form reset,
  - route refresh handoff.

## Key Decisions
- Test the real client component directly instead of the full `/entries` page.
- Keep router/toast/network mocked at the boundary rather than refactoring product code for test-only seams.
- Freeze only `Date`, not all timers, so deterministic date defaults do not interfere with user-event or MSW behavior.

## Testing
- `npm run test:component`
- `npm run test`

## Learnings
- Component tests for App Router forms need deterministic time plus cleanup between tests, otherwise duplicate DOM and hanging user interactions mask the real behavior under test.
- Freezing every timer was a harness bug, not an app bug. Freezing only `Date` preserved deterministic default values without breaking user-event or MSW.
