import assert from "node:assert/strict";
import test from "node:test";
import {
  parseCreateCarInput,
  parseCreateEntryInput,
  parseUpdateCarInput,
  parseUpdateTodoInput,
} from "../lib/db/validation.ts";

test("create car validation trims strings and preserves nullable values", () => {
  const input = parseCreateCarInput({
    name: "  Daily Driver  ",
    make: " Toyota ",
    model: " Camry ",
    year: 2024,
    vin: null,
    color: " Black ",
    license_plate: null,
    current_mileage: 1234,
    fuel_tank_capacity: 15.8,
    fuel_type: " gasoline ",
    image_url: null,
    notes: "  Bought used  ",
  });

  assert.equal(input.name, "Daily Driver");
  assert.equal(input.make, "Toyota");
  assert.equal(input.model, "Camry");
  assert.equal(input.color, "Black");
  assert.equal(input.fuel_type, "gasoline");
  assert.equal(input.notes, "Bought used");
});

test("entry validation rejects malformed dates", () => {
  assert.throws(
    () =>
      parseCreateEntryInput({
        car_id: "car-1",
        entry_type: "fuel",
        date: "03/16/2026",
        mileage: 2000,
        fuel_gallons: 10,
        fuel_price_per_gallon: 3.5,
        fuel_total_cost: 35,
        fuel_station: "Shell",
        fuel_octane: "87",
        was_full_tank: true,
        expense_category: "fuel",
        expense_amount: 35,
        description: null,
        vendor: null,
        parts_replaced: null,
        maintenance_item_id: null,
        todo_id: null,
        notes: null,
      }),
    /Invalid|date/i
  );
});

test("car update validation accepts partial payloads and rejects empty updates", () => {
  const parsed = parseUpdateCarInput({
    name: "  Weekend Car  ",
    notes: "  Ready for spring  ",
  });

  assert.deepEqual(parsed, {
    name: "Weekend Car",
    notes: "Ready for spring",
  });

  assert.throws(() => parseUpdateCarInput({}), /At least one car field/);
});

test("todo update validation requires at least one field", () => {
  assert.throws(() => parseUpdateTodoInput({}), /At least one todo field/);
});
