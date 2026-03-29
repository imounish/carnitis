# IP-020: Dashboard + Shared Surface Supabase Migration

## Metadata
- Task ID: T020
- Title: Dashboard + Shared Surface Supabase Migration
- Priority: P0
- Status: `draft`
- Related backlog item: T020

## 1. Problem Statement
The dashboard (`components/dashboard/dashboard-view.tsx`) is the only remaining route that uses mock data via `lib/db/api.ts` → `createMockDataAccess()`. Every other route (cars, entries, maintenance, todos) uses real Supabase data via `getServerDataAccess()`. In production, the dashboard — the first screen users see after login — would show hardcoded fake data.

## 2. Goals
- Dashboard loads real user data from Supabase
- Mock data layer is completely removed from the codebase
- Dashboard follows the same server-data pattern as all other routes

## 3. Non-Goals
- Redesigning the dashboard layout or adding new widgets
- Adding new stats or analytics beyond what currently exists
- Dashboard real-time updates or polling

## 4. Scope
### In Scope
- Convert `app/(app)/page.tsx` to fetch data server-side via `getServerDataAccess()`
- Refactor `DashboardView` to accept data as props instead of fetching client-side
- Wire `stats-service.ts` to real Supabase adapter
- Delete mock facade: `lib/db/api.ts`, `lib/db/mock/data-access.ts`, `lib/db/mock-data.ts`
- Update any tests that depend on mock data imports

### Out Of Scope
- Performance optimization of dashboard queries (see T014)
- Dashboard component visual redesign (see T013)
- New dashboard features or widgets

## 5. Constraints And Assumptions
- `lib/db/stats-service.ts` is already adapter-agnostic (accepts `DataAccess` interface) — no changes needed
- Dashboard sub-components (`StatCard`, `CarCard`, `RecentEntryRow`, `MaintenanceAlertRow`, `TodoAlertRow`, `ExpenseDonutChart`) are presentational — they receive data as props
- The `DashboardView` currently fetches 5 data sources in a `useEffect` with `Promise.all()`

## 6. Architecture And Design
- **Pattern**: Follow the same approach as `/cars`, `/entries`, `/maintenance`, `/todos` — server component page fetches data, passes to client component
- **Affected files**:
  - `app/(app)/page.tsx` — add server-side data fetching
  - `components/dashboard/dashboard-view.tsx` — accept props, remove `useEffect` data fetching, keep `"use client"` only if interactive features require it
  - `lib/db/api.ts` — delete entirely
  - `lib/db/mock/data-access.ts` — delete
  - `lib/db/mock-data.ts` — delete
- **Data model changes**: None
- **Auth/security impact**: Dashboard data will now respect RLS policies (user only sees their own data)

## 7. Implementation Steps
1. Add server-side data fetching to `app/(app)/page.tsx` using `getServerDataAccess()`
2. Define props interface for `DashboardView` with all required data
3. Refactor `DashboardView` to accept props instead of fetching client-side
4. Remove `useEffect` data fetching and related loading state (server data is ready on render)
5. Verify all dashboard sub-components work with real data shapes
6. Delete `lib/db/api.ts`
7. Delete `lib/db/mock/data-access.ts` and `lib/db/mock-data.ts`
8. Update any imports or tests referencing deleted files
9. Run quality gates

## 8. Test Plan
- Unit tests: Verify `stats-service.ts` works with Supabase data access
- Integration tests: Dashboard renders with real data structure
- Regression tests: Ensure no other files import from deleted mock modules

## 9. QA Plan
- Verify dashboard shows real user data (not mock) after login
- Verify empty state when user has no cars/entries
- Responsive: 320x568, 375x812, 768x1024, 1280+ desktop

## 10. Rollout And Rollback
- Rollout: Single PR, feature branch
- Rollback: Revert PR (mock files are in git history)

## 11. Risks And Mitigations
- Risk: Dashboard queries may be slow with real data
  - Mitigation: Acceptable for now; T014 (Performance) will optimize
- Risk: Empty state UX may be poor for new users with no data
  - Mitigation: Ensure graceful empty state rendering; T013 (UX Consistency) will polish

## 12. Acceptance Criteria
- [ ] Dashboard shows real user data from Supabase
- [ ] `DashboardView` receives data as props from server component
- [ ] `lib/db/api.ts`, `lib/db/mock/data-access.ts`, `lib/db/mock-data.ts` deleted
- [ ] No remaining imports from deleted mock modules
- [ ] All tests pass
- [ ] Quality gates pass (`lint`, `tsc`, `test`, `build`)
