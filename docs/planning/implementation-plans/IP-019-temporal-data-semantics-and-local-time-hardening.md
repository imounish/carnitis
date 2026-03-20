# IP-019: Temporal Data Semantics And Local-Time Hardening

## Metadata
- Task ID: `T019`
- Title: Temporal Data Semantics Audit + Local-Time Display Hardening
- Priority: `P0`
- Status: `completed`

## Summary
The schema was already mostly correct, but the app still mixed date-only values, timestamps, local parsing, and JavaScript month overflow in several helpers and mock/UI paths. `T019` introduced one shared temporal seam and normalized the app around two explicit temporal concepts:
- calendar dates: `YYYY-MM-DD`
- instants: ISO UTC timestamps

## Audit Result
### Calendar-date fields
- `entries.date`
- `maintenance_schedule_items.last_done_date`
- `maintenance_schedule_items.next_due_date`
- `todo_items.due_date`

### Instant timestamp fields
- `created_at`
- `updated_at`
- `completed_at`
- auth/profile/session timestamps

No schema migration was required because the database already stores these as `DATE` and `TIMESTAMPTZ` respectively.

## What Changed
- Added `lib/time.ts` as the canonical temporal helper boundary.
- Moved local-today, date-only parsing, relative formatting, timestamp formatting, and month arithmetic into one shared seam.
- Replaced timezone-sensitive date-only math in:
  - `lib/db/mock/data-access.ts`
  - `lib/db/supabase/entry-workflow.ts`
  - `components/maintenance/maintenance-view.tsx`
  - `lib/db/validation.ts`
  - `lib/format.ts`

## Key Decisions
- Date-only values never shift calendar day because of timezone.
- Timestamp values stay as UTC instants and are localized only when displayed.
- Month arithmetic uses end-of-month clamping instead of JavaScript overflow behavior.

## Testing
- Added direct temporal regression coverage for:
  - date-only parsing,
  - local “today” generation,
  - end-of-month clamped month addition,
  - explicit-timezone timestamp formatting,
  - deterministic relative-date formatting.

## Learnings
- The real risk was not the schema; it was duplicated helper logic.
- `new Date("YYYY-MM-DD")` and `setMonth()` are too error-prone for business-date logic. A shared date-only seam is simpler and safer.
- Month-end rollover must be defined deliberately. Default JavaScript overflow is not suitable for maintenance schedules.
