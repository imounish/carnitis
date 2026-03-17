import assert from "node:assert/strict";
import test from "node:test";
import {
  getCarCostPerMile,
  getCarExpenseBreakdown,
  getCarTotalSpent,
} from "../lib/db/cars.ts";

const sampleCar = {
  id: "car-1",
  name: "Daily Driver",
  make: "Toyota",
  model: "Camry",
  year: 2024,
  vin: null,
  color: "Black",
  license_plate: "TEST-1",
  current_mileage: 20000,
  fuel_tank_capacity: 15.8,
  fuel_type: "gasoline",
  total_fuel_spent: 500,
  total_maintenance_spent: 200,
  total_improvements_spent: 50,
  total_repairs_spent: 25,
  image_url: null,
  notes: null,
  created_at: "2026-03-10T00:00:00.000Z",
  updated_at: "2026-03-11T00:00:00.000Z",
};

test("computes total spent and cost per mile from car-owned fields", () => {
  assert.equal(getCarTotalSpent(sampleCar), 775);
  assert.equal(getCarCostPerMile(sampleCar), 0.04);
});

test("returns the expected expense breakdown order for the detail view", () => {
  const breakdown = getCarExpenseBreakdown(sampleCar);

  assert.deepEqual(
    breakdown.map((item) => item.key),
    ["fuel", "maintenance", "improvements", "repairs"]
  );
  assert.equal(breakdown[0].value, 500);
  assert.equal(breakdown[3].value, 25);
});

test("returns zero cost per mile when the car has no mileage yet", () => {
  assert.equal(
    getCarCostPerMile({
      ...sampleCar,
      current_mileage: 0,
    }),
    0
  );
});
