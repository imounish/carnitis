import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCreateEntryPayloadFromFormData,
  safeParseCreateEntryPayload,
} from "../lib/db/entry-payload.ts";

test("builds a normalized fuel entry payload from form data", () => {
  const formData = new FormData();
  formData.set("car_id", "car-1");
  formData.set("entry_type", "fuel");
  formData.set("date", "2026-03-17");
  formData.set("mileage", "12345");
  formData.set("fuel_gallons", "10.5");
  formData.set("fuel_price_per_gallon", "3.259");
  formData.set("fuel_station", "  Costco  ");
  formData.set("fuel_octane", "87");
  formData.set("was_full_tank", "on");
  formData.set("fuel_level_before", "25");

  const payload = buildCreateEntryPayloadFromFormData(formData);

  assert.equal(payload.entry_type, "fuel");
  assert.equal(payload.fuel_total_cost, 34.22);
  assert.equal(payload.expense_category, "fuel");
  assert.equal(payload.expense_amount, 34.22);
  assert.equal(payload.fuel_level_before, 25);
  assert.equal(payload.description, "Fuel - 10.5 gal");
  assert.equal(payload.vendor, "Costco");
  assert.equal(payload.maintenance_item_id, null);
  assert.equal(payload.todo_id, null);
});

test("normalizes maintenance-done payloads with optional cost and links", () => {
  const parsed = safeParseCreateEntryPayload({
    car_id: "car-1",
    entry_type: "maintenance_done",
    date: "2026-03-17",
    mileage: 15000,
    description: "  Oil change  ",
    expense_category: "preventive_maintenance",
    expense_amount: 49.995,
    maintenance_item_id: "maint-1",
    todo_id: "todo-1",
    notes: "  completed at home  ",
  });

  assert.equal(parsed.success, true);
  assert.deepEqual(parsed.data, {
    car_id: "car-1",
    entry_type: "maintenance_done",
    date: "2026-03-17",
    mileage: 15000,
    fuel_gallons: null,
    fuel_price_per_gallon: null,
    fuel_total_cost: null,
    fuel_station: null,
    fuel_octane: null,
    was_full_tank: null,
    fuel_level_before: null,
    expense_category: "preventive_maintenance",
    expense_amount: 50,
    description: "Oil change",
    vendor: null,
    parts_replaced: null,
    maintenance_item_id: "maint-1",
    todo_id: "todo-1",
    notes: "completed at home",
  });
});

test("rejects invalid maintenance expense payloads missing required fields", () => {
  const parsed = safeParseCreateEntryPayload({
    car_id: "car-1",
    entry_type: "maintenance_expense",
    date: "2026-03-17",
    mileage: 14000,
    expense_amount: 0,
    description: "",
  });

  assert.equal(parsed.success, false);
});

test("normalizes absent fuel level before fill to null", () => {
  const parsed = safeParseCreateEntryPayload({
    car_id: "car-1",
    entry_type: "fuel",
    date: "2026-03-17",
    mileage: 15000,
    fuel_gallons: 10,
    fuel_price_per_gallon: 3.5,
    fuel_station: null,
    fuel_octane: null,
    was_full_tank: false,
  });

  assert.equal(parsed.success, true);
  assert.equal(parsed.data.fuel_level_before, null);
});

test("normalizes blank fuel level before fill form value to null", () => {
  const formData = new FormData();
  formData.set("car_id", "car-1");
  formData.set("entry_type", "fuel");
  formData.set("date", "2026-03-17");
  formData.set("mileage", "15000");
  formData.set("fuel_gallons", "10");
  formData.set("fuel_price_per_gallon", "3.5");
  formData.set("fuel_level_before", "");

  const payload = buildCreateEntryPayloadFromFormData(formData);

  assert.equal(payload.fuel_level_before, null);
});

test("accepts fuel level before fill edge values", () => {
  for (const fuelLevelBefore of [0, 100]) {
    const parsed = safeParseCreateEntryPayload({
      car_id: "car-1",
      entry_type: "fuel",
      date: "2026-03-17",
      mileage: 15000,
      fuel_gallons: 10,
      fuel_price_per_gallon: 3.5,
      fuel_level_before: fuelLevelBefore,
    });

    assert.equal(parsed.success, true);
    assert.equal(parsed.data.fuel_level_before, fuelLevelBefore);
  }
});

test("rejects fuel level before fill outside 0 to 100 percent", () => {
  const parsed = safeParseCreateEntryPayload({
    car_id: "car-1",
    entry_type: "fuel",
    date: "2026-03-17",
    mileage: 15000,
    fuel_gallons: 10,
    fuel_price_per_gallon: 3.5,
    fuel_level_before: 101,
  });

  assert.equal(parsed.success, false);
});

test("rejects non-integer fuel level before fill from form data", () => {
  const formData = new FormData();
  formData.set("car_id", "car-1");
  formData.set("entry_type", "fuel");
  formData.set("date", "2026-03-17");
  formData.set("mileage", "15000");
  formData.set("fuel_gallons", "10");
  formData.set("fuel_price_per_gallon", "3.5");
  formData.set("fuel_level_before", "25.5");

  assert.throws(
    () => buildCreateEntryPayloadFromFormData(formData),
    /integer/i
  );
});
