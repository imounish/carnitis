import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCreateMaintenancePayload,
  buildUpdateMaintenancePayload,
} from "../lib/db/maintenance-form.ts";

test("buildCreateMaintenancePayload normalizes optional maintenance form fields", () => {
  const formData = new FormData();
  formData.set("name", " Oil Change ");
  formData.set("description", " Synthetic service ");
  formData.set("interval_miles", "5000");
  formData.set("interval_months", "6");
  formData.set("estimated_cost", "89.99");
  formData.set("notes", " Inspect filter ");

  assert.deepEqual(buildCreateMaintenancePayload(formData, "car-1"), {
    car_id: "car-1",
    name: "Oil Change",
    description: "Synthetic service",
    interval_miles: 5000,
    interval_months: 6,
    last_done_mileage: null,
    last_done_date: null,
    estimated_cost: 89.99,
    notes: "Inspect filter",
  });
});

test("buildUpdateMaintenancePayload only includes changed editable fields", () => {
  const formData = new FormData();
  formData.set("name", "Oil Change");
  formData.set("description", "");
  formData.set("interval_miles", "6000");
  formData.set("interval_months", "6");
  formData.set("last_done_mileage", "14500");
  formData.set("last_done_date", "2026-03-18");
  formData.set("estimated_cost", "95.00");
  formData.set("notes", "");

  assert.deepEqual(
    buildUpdateMaintenancePayload(formData, {
      name: "Oil Change",
      description: null,
      interval_miles: 5000,
      interval_months: 6,
      last_done_mileage: null,
      last_done_date: null,
      estimated_cost: 95,
      notes: null,
    }),
    {
      interval_miles: 6000,
      last_done_mileage: 14500,
      last_done_date: "2026-03-18",
    }
  );
});
