import { describe, expect, it } from "vitest";
import {
  buildCreateMaintenanceInput,
  buildUpdateMaintenanceInput,
} from "@/lib/db/maintenance-api";

describe("maintenance API helpers", () => {
  it("computes server-owned due fields and status for creates", () => {
    expect(
      buildCreateMaintenanceInput(
        {
          car_id: "car-1",
          name: "Oil Change",
          description: null,
          interval_miles: 5000,
          interval_months: 6,
          last_done_mileage: 12000,
          last_done_date: "2026-01-15",
          estimated_cost: 89.99,
          notes: null,
        },
        14000
      )
    ).toEqual({
      car_id: "car-1",
      name: "Oil Change",
      description: null,
      interval_miles: 5000,
      interval_months: 6,
      last_done_mileage: 12000,
      last_done_date: "2026-01-15",
      next_due_mileage: 17000,
      next_due_date: "2026-07-15",
      status: "upcoming",
      estimated_cost: 89.99,
      notes: null,
    });
  });

  it("recomputes next due fields and status from merged update values", () => {
    expect(
      buildUpdateMaintenanceInput(
        {
          interval_miles: 5000,
          last_done_mileage: 14800,
          last_done_date: "2026-03-18",
        },
        {
          id: "maint-1",
          car_id: "car-1",
          name: "Oil Change",
          description: null,
          interval_miles: 4500,
          interval_months: 6,
          last_done_mileage: null,
          last_done_date: null,
          next_due_mileage: 16500,
          next_due_date: "2026-09-18",
          status: "upcoming",
          estimated_cost: 80,
          notes: null,
          created_at: "2026-01-01T10:00:00.000Z",
          updated_at: "2026-03-10T10:00:00.000Z",
        },
        15000
      )
    ).toEqual({
      interval_miles: 5000,
      last_done_mileage: 14800,
      last_done_date: "2026-03-18",
      next_due_mileage: 19800,
      next_due_date: "2026-09-18",
      status: "upcoming",
    });
  });
});
