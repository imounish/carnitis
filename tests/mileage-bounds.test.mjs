import assert from "node:assert/strict";
import test from "node:test";
import { getMileageBounds } from "../lib/db/mileage-bounds.ts";

function makeEntry(id, date, mileage) {
  return {
    id,
    car_id: "car-1",
    entry_type: "fuel",
    date,
    mileage,
    fuel_gallons: null,
    fuel_price_per_gallon: null,
    fuel_total_cost: null,
    fuel_station: null,
    fuel_octane: null,
    was_full_tank: null,
    expense_category: null,
    expense_amount: null,
    description: null,
    vendor: null,
    parts_replaced: null,
    maintenance_item_id: null,
    todo_id: null,
    notes: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

const entries = [
  makeEntry("e1", "2026-01-10", 1000),
  makeEntry("e2", "2026-02-15", 1500),
  makeEntry("e3", "2026-03-20", 2000),
];

test("returns min=0 and max=Infinity when there are no surrounding entries", () => {
  const bounds = getMileageBounds([], "2026-06-01");
  assert.equal(bounds.min, 0);
  assert.equal(bounds.max, Infinity);
  assert.equal(bounds.minEntry, null);
  assert.equal(bounds.maxEntry, null);
});

test("returns lower bound from the latest entry at or before the date", () => {
  const bounds = getMileageBounds(entries, "2026-02-20");
  assert.equal(bounds.min, 1500);
  assert.equal(bounds.minEntry?.id, "e2");
});

test("returns upper bound from the earliest entry at or after the date", () => {
  const bounds = getMileageBounds(entries, "2026-02-20");
  assert.equal(bounds.max, 2000);
  assert.equal(bounds.maxEntry?.id, "e3");
});

test("returns both bounds for a date between two entries", () => {
  const bounds = getMileageBounds(entries, "2026-02-01");
  assert.equal(bounds.min, 1000);
  assert.equal(bounds.max, 1500);
});

test("returns only lower bound for a date after all entries", () => {
  const bounds = getMileageBounds(entries, "2026-12-01");
  assert.equal(bounds.min, 2000);
  assert.equal(bounds.max, Infinity);
  assert.equal(bounds.maxEntry, null);
});

test("returns only upper bound for a date before all entries", () => {
  const bounds = getMileageBounds(entries, "2025-12-01");
  assert.equal(bounds.min, 0);
  assert.equal(bounds.max, 1000);
  assert.equal(bounds.minEntry, null);
});

test("uses the entry with the highest mileage as lower bound when multiple entries share a date", () => {
  const sameDay = [
    makeEntry("a", "2026-03-01", 3100),
    makeEntry("b", "2026-03-01", 3200),
    makeEntry("c", "2026-04-01", 4000),
  ];
  const bounds = getMileageBounds(sameDay, "2026-03-15");
  assert.equal(bounds.min, 3200);
});

test("uses the entry with the lowest mileage as upper bound when multiple entries share a date", () => {
  const sameDay = [
    makeEntry("a", "2026-02-01", 2000),
    makeEntry("b", "2026-03-01", 3100),
    makeEntry("c", "2026-03-01", 3200),
  ];
  const bounds = getMileageBounds(sameDay, "2026-02-15");
  assert.equal(bounds.max, 3100);
});

test("the entry on the exact same date is included in both bounds", () => {
  const bounds = getMileageBounds(entries, "2026-02-15");
  // e2 is on 2026-02-15 at 1500 — should be both the lower and upper bound
  assert.equal(bounds.min, 1500);
  assert.equal(bounds.max, 1500);
  assert.equal(bounds.minEntry?.id, "e2");
  assert.equal(bounds.maxEntry?.id, "e2");
});
