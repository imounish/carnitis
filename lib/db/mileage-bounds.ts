import type { Entry } from "@/lib/db/schema";

export interface MileageBounds {
  min: number;
  max: number;
  minEntry: Entry | null;
  maxEntry: Entry | null;
}

/**
 * Given a list of entries for a car and a target date, returns the valid
 * mileage range for a new entry on that date.
 *
 * - min: mileage of the latest entry at or before `date` (0 if none)
 * - max: mileage of the earliest entry at or after `date` (Infinity if none)
 */
export function getMileageBounds(entries: Entry[], date: string): MileageBounds {
  const lowerEntry =
    entries
      .filter((e) => e.date <= date)
      .sort((a, b) => b.date.localeCompare(a.date) || b.mileage - a.mileage)[0] ?? null;

  const upperEntry =
    entries
      .filter((e) => e.date >= date)
      .sort((a, b) => a.date.localeCompare(b.date) || a.mileage - b.mileage)[0] ?? null;

  return {
    min: lowerEntry?.mileage ?? 0,
    max: upperEntry?.mileage ?? Infinity,
    minEntry: lowerEntry,
    maxEntry: upperEntry,
  };
}
