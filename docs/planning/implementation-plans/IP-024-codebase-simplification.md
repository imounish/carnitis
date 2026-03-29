# IP-024: Codebase Simplification + Code Quality Hardening

## Metadata
- Task ID: T024
- Title: Codebase Simplification + Code Quality Hardening
- Priority: P1
- Status: `draft`
- Related backlog item: T024

## 1. Problem Statement
The codebase has accumulated duplication and unnecessary complexity through incremental domain migrations. ~1,300 lines can be consolidated. Patterns are repeated across 4 domain modules (cars, entries, maintenance, todos) that should share infrastructure.

## 2. Goals
- Eliminate all meaningful code duplication
- Every file as short as possible while remaining clear
- No logic exists in more than one place
- Abstractions earn their existence — delete any that don't reduce total complexity
- Self-documenting names; no comments needed for obvious code

## 3. Non-Goals
- New features or behavior changes
- Performance optimization (see T014)
- UI/UX changes

## 4. Scope

### S1: API Route Factory (HIGH — ~200 lines saved)
**Problem**: 4 POST routes and 4 PUT/DELETE routes share 80%+ identical boilerplate (auth check → parse JSON → validate → data access → respond).
**Solution**: Extract `createResourceRoute()` utility. Each route file becomes: schema + data access call + factory invocation.
**Files**:
- `app/api/cars/route.ts`, `app/api/entries/route.ts`, `app/api/maintenance/route.ts`, `app/api/todos/route.ts`
- `app/api/cars/[id]/route.ts`, `app/api/maintenance/[id]/route.ts`, `app/api/todos/[id]/route.ts`
- New: `lib/api/route-helpers.ts`

### S2: Validation Primitive Consolidation (HIGH — ~60 lines saved)
**Problem**: Zod primitives (`nonEmptyString`, `nullableTrimmedString`, `isoDateString`, `numberField`) and enum definitions (`expenseCategories`, `todoStatuses`) are copy-pasted across `validation.ts`, `maintenance-api.ts`, `todo-api.ts`.
**Solution**: Single source of truth in `lib/db/validation.ts`. All other files import from there.
**Files**: `lib/db/validation.ts` (canonical), `lib/db/maintenance-api.ts`, `lib/db/todo-api.ts`

### S3: Error Payload Factory (MEDIUM — ~150 lines saved)
**Problem**: 4 domain-specific `*-api-payloads.ts` files (216 lines total) implement identical error payload patterns with only entity names differing.
**Solution**: Generic `createErrorPayload(status, code, message)` replaces all domain-specific variants.
**Files**: `lib/db/cars-api-payloads.ts`, `lib/db/maintenance-api-payloads.ts`, `lib/db/todo-api-payloads.ts`, `lib/db/entries-api-payloads.ts` → consolidate or delete

### S4: Data Access Decomposition (MEDIUM — clarity improvement)
**Problem**: `lib/db/supabase/data-access.ts` is 702 lines mixing 4 repositories with repeated try-catch + `logDataAccessError()` boilerplate.
**Solution**: Split into domain-focused files. Extract `withErrorHandling()` wrapper. `data-access.ts` becomes thin composition.
**Files**:
- `lib/db/supabase/data-access.ts` → split into:
  - `lib/db/supabase/cars-repository.ts`
  - `lib/db/supabase/entries-repository.ts`
  - `lib/db/supabase/maintenance-repository.ts`
  - `lib/db/supabase/todos-repository.ts`
  - `lib/db/supabase/data-access.ts` (thin composition)

### S5: Mapper Deduplication (MEDIUM — ~40 lines saved)
**Problem**: `mapEntryRow()` defined identically in `mappers.ts` and `entry-workflow.ts`. Number conversion helpers (`toNumber()`, `toRequiredNumber()`, `toIsoTimestamp()`) duplicated.
**Solution**: Consolidate into `mappers.ts`; `entry-workflow.ts` imports.
**Files**: `lib/db/supabase/mappers.ts` (canonical), `lib/db/supabase/entry-workflow.ts`

### S6: Dashboard Component Decomposition (MEDIUM — after T020)
**Problem**: After T020, `dashboard-view.tsx` should be pure presentation.
**Solution**: Ensure component receives typed props and renders — no business logic, no data fetching.
**Files**: `components/dashboard/dashboard-view.tsx`, `app/(app)/page.tsx`

### S7: Dead Code Cleanup (LOW — hygiene)
**Problem**: After T020, mock facade files are dead code.
**Solution**: Delete `lib/db/api.ts`, `lib/db/mock/data-access.ts`, `lib/db/mock-data.ts`. Audit unused exports.
**Verification**: `npx tsc --noEmit` and all tests pass after each deletion.

## 5. Implementation Order
S2 → S5 → S3 → S1 → S4 → S7 → S6

Start with low-risk deduplication, progress to structural changes, end with cleanup that depends on T020.

## 6. Constraints
- No behavior changes — all changes are structural/organizational only
- All existing tests must pass without modification (or with minimal import path updates)
- No new files created without deleting at least as much code as they contain
- Line count of touched files must decrease or stay flat

## 7. Test Plan
- All existing unit tests pass
- All existing component tests pass
- `npx tsc --noEmit` passes
- `npm run build` passes
- Manual smoke test of each route after structural changes

## 8. Acceptance Criteria
- [ ] No duplicated Zod primitives or enum definitions
- [ ] No duplicated mapper functions
- [ ] API routes use shared factory pattern
- [ ] Error payloads use generic factory
- [ ] `data-access.ts` split into domain-focused files
- [ ] Mock facade deleted (after T020)
- [ ] Dashboard component is pure presentation (after T020)
- [ ] All quality gates pass
- [ ] Total line count decreased
