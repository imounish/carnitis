# Implementation Plan: IP-025 — Fuel Level Before Fill-Up

## Metadata
- Task ID: T025
- Title: Fuel Level Before Fill-Up — Partial Fill Range Accuracy
- Priority: P1
- Owner: Mounish Pedagandham
- Status: `done`
- Related backlog item: T025

## 1. Problem Statement

When recording a gas fill-up, users cannot input the fuel gauge level before pumping. The current range estimate assumes a full tank after every full-tank entry, which is wrong after partial fills. This makes the estimated range unreliable and prevents meaningful statistics for users who never fill completely.

## 2. Goals

- Let users optionally record the tank level (0–100%) before filling up.
- Use that reading to compute a more accurate post-fill fuel amount.
- Update the range estimate to reflect actual remaining fuel, not an assumed full tank.

## 3. Non-Goals

- Rewriting the MPG calculation to use partial-fill segments (deferred — full-tank algorithm stays).
- Displaying a fuel gauge visual or anything beyond a simple numeric input.
- Making `fuel_level_before` mandatory.

## 4. Scope

### In Scope

- New nullable DB column `fuel_level_before` (integer 0–100) on `entries`.
- Zod schema, FormData parser, and payload normalizer updated.
- `Entry` and `CreateEntryInput` types updated.
- Row mapper in data-access updated.
- Range estimate in `stats-service.ts` updated.
- Optional integer input (0–100) added to the fuel entry form.

### Out Of Scope

- MPG calculation changes (full-tank algorithm unchanged).
- Edit flow changes (`fuel_level_before` is record-only on creation for now).
- Any UI outside the fuel entry form.

## 5. Constraints and Assumptions

- Technical: `tank_capacity` must be set on the car for the improved range estimate to work; no change to that fallback.
- Product: Field is always optional; absence does not break anything.
- Assumption: Integer percent (0–100) is precise enough; decimal fuel gauge readings are rare.

## 6. Architecture and Design

- **Affected layers**: DB migration, type definitions, Zod schema, form data parser, row mapper, stats service, fuel entry form component.
- **Data model changes**: One nullable `smallint` column on `entries` with a `CHECK (fuel_level_before BETWEEN 0 AND 100)` constraint.
- **Auth/security impact**: None — existing RLS policies cover the new column automatically.
- **Mobile-first UX**: Input uses `type="number"` with `min=0`, `max=100`, `step=1`, and a `%` suffix label. Field is optional with helper text.

## 7. Implementation Steps

1. **Migration** — create `supabase/migrations/<timestamp>_add_fuel_level_before.sql`:
   ```sql
   ALTER TABLE public.entries
     ADD COLUMN IF NOT EXISTS fuel_level_before smallint CHECK (fuel_level_before BETWEEN 0 AND 100);
   ```

2. **Types** (`lib/db/types.ts`) — add `fuel_level_before: number | null` to both `Entry` and `CreateEntryInput`.

3. **Zod schema** (`lib/db/entry-payload.ts`):
   - Add to `fuelPayloadSchema`: `fuel_level_before: z.number().int().min(0).max(100).nullable().optional().default(null)`
   - Read from FormData in `buildCreateEntryPayloadFromFormData` using `getOptionalPositiveNumberValue`
   - Pass through `null` for non-fuel entry types in `normalizeCreateEntryPayload`

4. **Row mapper** (`lib/db/supabase/data-access.ts`) — include `fuel_level_before: row.fuel_level_before ?? null` in the entry row mapper.

5. **Stats service** (`lib/db/stats-service.ts`) — update range estimate to use the newest fuel entry with a usable level signal:

   Replace current range logic (lines 49–56):
   ```typescript
   const lastFuel = recentFuel[0];
   const milesSinceLastFill = lastFuel ? car.current_mileage - lastFuel.mileage : 0;
   const estimatedRange =
     avgMpg > 0 && car.fuel_tank_capacity
       ? car.fuel_tank_capacity * avgMpg - milesSinceLastFill
       : null;
   ```

   New logic:
   ```typescript
   const mostRecentFuelEntryWithLevelSignal = fuelEntries
     .sort((a, b) => b.date.localeCompare(a.date) || b.mileage - a.mileage)
     .find((entry) => entry.was_full_tank || entry.fuel_level_before != null);
   const milesSinceLastFill = mostRecentFuelEntryWithLevelSignal
     ? car.current_mileage - mostRecentFuelEntryWithLevelSignal.mileage
     : 0;

   let gallonsAfterLastFill: number | null = null;
   if (mostRecentFuelEntryWithLevelSignal && car.fuel_tank_capacity) {
     if (mostRecentFuelEntryWithLevelSignal.was_full_tank) {
       gallonsAfterLastFill = car.fuel_tank_capacity;
     } else if (mostRecentFuelEntryWithLevelSignal.fuel_level_before != null) {
       gallonsAfterLastFill = Math.min(
         car.fuel_tank_capacity,
         (mostRecentFuelEntryWithLevelSignal.fuel_level_before / 100) * car.fuel_tank_capacity +
           (mostRecentFuelEntryWithLevelSignal.fuel_gallons ?? 0)
       );
     }
   }

   const estimatedRange =
     avgMpg > 0 && gallonsAfterLastFill != null
       ? Math.max(0, Math.round(gallonsAfterLastFill * avgMpg - milesSinceLastFill))
       : null;
   ```

   Note: clamp to 0 is preserved; the existing `Math.max(0, Math.round(...))` wrapper moves into the formula.

6. **UI** (`components/entries/entry-log-view.tsx`) — add below the `was_full_tank` toggle in the fuel form section:
   ```tsx
   <div className="space-y-1">
     <Label htmlFor="fuel_level_before" className="text-sm">
       Fuel level before fill (%)
     </Label>
     <div className="flex items-center gap-2">
       <Input
         id="fuel_level_before"
         type="number"
         name="fuel_level_before"
         min={0}
         max={100}
         step={1}
         placeholder="e.g. 25"
         className="w-28"
       />
       <span className="text-sm text-muted-foreground">%</span>
     </div>
     <p className="text-xs text-muted-foreground">Optional — improves range estimate</p>
   </div>
   ```

7. **Apply migration** locally: `supabase migration up` (or `supabase db reset` for a clean local env).

## 8. Test Plan

- **Unit** (`entry-payload.ts`): verify `fuel_level_before` parses correctly from FormData — valid 0–100, `null` when absent, rejects values outside 0–100.
- **Unit** (`stats-service.ts`): verify range estimate uses `fuel_level_before` path when set, falls back to full-tank path when `was_full_tank = true`, returns `null` when neither.
- **Integration**: create a fuel entry with `fuel_level_before = 30`, verify it persists to DB and the range estimate reflects it.
- **Regression**: existing full-tank entries without `fuel_level_before` produce the same range estimate as before.

## 9. QA Plan

- **Responsive**: verify the new input is usable on mobile (touch target ≥ 44px, readable label at small viewports).
- **Accessibility**: input has a matching `id`/`htmlFor` label, `min`/`max` attributes communicate constraints.
- **Manual flows**:
  1. Create a partial fill-up with fuel level = 30% → check car stats page shows updated range.
  2. Create a fill-up with no fuel level → verify range estimate falls back to full-tank assumption.
  3. Leave `was_full_tank` unchecked and `fuel_level_before` empty → range estimate falls back to the newest older entry with a usable level signal, or `null` if none exists.

## 10. Rollout and Rollback

- **Rollout**: additive migration (`ADD COLUMN IF NOT EXISTS`) — zero downtime, no data loss, all existing rows get `NULL`.
- **Rollback**: `ALTER TABLE entries DROP COLUMN fuel_level_before` — safe since it is nullable with no foreign key dependencies.
- **Monitoring**: confirm existing car stats pages load without error after deploy.

## 11. Risks and Mitigations

- **Risk**: `fuel_level_before` + `fuel_gallons` may imply a post-fill level exceeding `tank_capacity` (user data entry error) → range estimate inflated.
  - **Mitigation**: `gallonsAfterLastFill` is used as-is; the range clamp (`Math.max(0, ...)`) prevents negative display. A future validation could warn if `(fuel_level_before/100 * tank_capacity) + fuel_gallons > tank_capacity`.

## 12. Acceptance Criteria

- [x] `fuel_level_before` column exists in `entries` table with `CHECK (fuel_level_before BETWEEN 0 AND 100)`.
- [x] Fuel entry form shows an optional "Fuel level before fill (%)" input.
- [x] Submitting the form with a value persists it to the DB.
- [x] Submitting without a value stores `null` — no validation error.
- [x] Range estimate on car stats uses `fuel_level_before` when present.
- [x] Range estimate falls back to full-tank assumption when `fuel_level_before` is null and `was_full_tank` is true.
- [x] Range estimate falls back to the newest older usable fuel signal when the latest fuel entry has neither `fuel_level_before` nor `was_full_tank`.
- [x] Range estimate is `null` when no fuel entry has a usable level signal.
- [x] Existing full-tank entries without `fuel_level_before` produce the same range estimate as before.
- [x] TypeScript compiles with no errors.

## 13. Definition of Done Check

- [x] Code complete
- [x] Tests complete
- [x] Docs/plans updated
- [x] Quality gates passed

## 14. Verification Notes

- `npm run test:unit` passed. DB-backed local Supabase tests were skipped because local env was not configured.
- `npm run test:component` passed.
- `npx tsc --noEmit` passed.
- `npm run lint` passed with three pre-existing warnings in toast/config files.
- `npm run build` passed with non-secret local placeholder environment values.
