import assert from "node:assert/strict";
import test from "node:test";
import {
  applyDerivedMaintenanceState,
  calculateNextDueFields,
  compareMaintenanceItems,
  deriveMaintenanceStatus,
} from "../lib/db/maintenance-scheduling.ts";

test("calculateNextDueFields uses last-done values when present", () => {
  const nextDue = calculateNextDueFields(
    {
      interval_miles: 5000,
      interval_months: 6,
      last_done_mileage: 12000,
      last_done_date: "2026-01-15",
    },
    {
      currentMileage: 14000,
      today: "2026-03-18",
    }
  );

  assert.deepEqual(nextDue, {
    next_due_mileage: 17000,
    next_due_date: "2026-07-15",
  });
});

test("deriveMaintenanceStatus treats overdue and due-soon as server-owned derived state", () => {
  assert.equal(
    deriveMaintenanceStatus({
      interval_miles: 5000,
      currentMileage: 15000,
      next_due_mileage: 14000,
      next_due_date: null,
      today: "2026-03-18",
    }),
    "overdue"
  );

  assert.equal(
    deriveMaintenanceStatus({
      interval_miles: 5000,
      currentMileage: 15000,
      next_due_mileage: 15800,
      next_due_date: null,
      today: "2026-03-18",
    }),
    "due_soon"
  );

  assert.equal(
    deriveMaintenanceStatus({
      interval_miles: 7500,
      currentMileage: 15000,
      next_due_mileage: 23000,
      next_due_date: "2027-01-01",
      today: "2026-03-18",
    }),
    "upcoming"
  );
});

test("applyDerivedMaintenanceState and compareMaintenanceItems order the most urgent items first", () => {
  const overdue = applyDerivedMaintenanceState(
    {
      id: "maint-1",
      car_id: "car-1",
      name: "Brake Inspection",
      description: null,
      interval_miles: 5000,
      interval_months: null,
      last_done_mileage: 9000,
      last_done_date: null,
      next_due_mileage: 9500,
      next_due_date: null,
      status: "upcoming",
      estimated_cost: 100,
      notes: null,
      created_at: "2026-01-01T10:00:00.000Z",
      updated_at: "2026-01-01T10:00:00.000Z",
    },
    12000,
    "2026-03-18"
  );

  const dueSoon = applyDerivedMaintenanceState(
    {
      ...overdue,
      id: "maint-2",
      name: "Oil Change",
      next_due_mileage: 12800,
      status: "upcoming",
    },
    12000,
    "2026-03-18"
  );

  const upcoming = applyDerivedMaintenanceState(
    {
      ...overdue,
      id: "maint-3",
      name: "Air Filter",
      next_due_mileage: 22000,
      status: "overdue",
    },
    12000,
    "2026-03-18"
  );

  const ordered = [upcoming, dueSoon, overdue].sort(compareMaintenanceItems);
  assert.deepEqual(
    ordered.map((item) => ({ id: item.id, status: item.status })),
    [
      { id: "maint-1", status: "overdue" },
      { id: "maint-2", status: "due_soon" },
      { id: "maint-3", status: "upcoming" },
    ]
  );
});
