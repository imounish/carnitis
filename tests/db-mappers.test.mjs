import assert from "node:assert/strict";
import test from "node:test";
import {
  mapCarRow,
  mapEntryRow,
  mapMaintenanceItemRow,
  mapTodoRow,
} from "../lib/db/supabase/mappers.ts";

test("car mapper normalizes numeric and timestamp values", () => {
  const car = mapCarRow({
    id: "car-1",
    owner_user_id: "user-1",
    name: "Daily Driver",
    make: "Toyota",
    model: "Camry",
    year: 2024,
    vin: null,
    color: null,
    license_plate: null,
    current_mileage: "12345.6",
    fuel_tank_capacity: "15.8",
    fuel_type: "gasoline",
    total_fuel_spent: "300.50",
    total_maintenance_spent: "80.00",
    total_improvements_spent: "0.00",
    total_repairs_spent: "0.00",
    image_url: null,
    notes: null,
    created_at: "2026-03-16T12:00:00.000Z",
    updated_at: new Date("2026-03-17T12:00:00.000Z"),
  });

  assert.equal(car.current_mileage, 12345.6);
  assert.equal(car.fuel_tank_capacity, 15.8);
  assert.equal(car.total_fuel_spent, 300.5);
  assert.equal(car.updated_at, "2026-03-17T12:00:00.000Z");
});

test("entry mapper preserves optional linkage fields", () => {
  const entry = mapEntryRow({
    id: "entry-1",
    owner_user_id: "user-1",
    car_id: "car-1",
    entry_type: "maintenance_expense",
    date: "2026-03-16",
    mileage: "12500",
    fuel_gallons: null,
    fuel_price_per_gallon: null,
    fuel_total_cost: null,
    fuel_station: null,
    fuel_octane: null,
    was_full_tank: null,
    expense_category: "regular_maintenance",
    expense_amount: "95.25",
    description: "Oil change",
    vendor: "Shop",
    parts_replaced: "Filter",
    maintenance_item_id: "maint-1",
    todo_id: "todo-1",
    notes: null,
    created_at: new Date("2026-03-16T12:00:00.000Z"),
    updated_at: new Date("2026-03-16T12:00:00.000Z"),
  });

  assert.equal(entry.expense_amount, 95.25);
  assert.equal(entry.maintenance_item_id, "maint-1");
  assert.equal(entry.todo_id, "todo-1");
});

test("maintenance and todo mappers normalize status rows", () => {
  const maintenance = mapMaintenanceItemRow({
    id: "maint-1",
    owner_user_id: "user-1",
    car_id: "car-1",
    name: "Oil Change",
    description: null,
    interval_miles: "7500",
    interval_months: 6,
    last_done_mileage: "12000",
    last_done_date: "2026-03-01",
    next_due_mileage: "19500",
    next_due_date: "2026-09-01",
    status: "upcoming",
    estimated_cost: "89.99",
    notes: null,
    created_at: "2026-03-01T00:00:00.000Z",
    updated_at: "2026-03-01T00:00:00.000Z",
  });

  const todo = mapTodoRow({
    id: "todo-1",
    owner_user_id: "user-1",
    car_id: "car-1",
    title: "Replace wiper blades",
    description: null,
    priority: "medium",
    status: "completed",
    category: "preventive_maintenance",
    estimated_cost: "25.00",
    linked_entry_id: "entry-1",
    due_date: "2026-03-20",
    completed_at: new Date("2026-03-18T09:30:00.000Z"),
    created_at: "2026-03-15T00:00:00.000Z",
    updated_at: "2026-03-18T09:30:00.000Z",
  });

  assert.equal(maintenance.interval_miles, 7500);
  assert.equal(maintenance.estimated_cost, 89.99);
  assert.equal(todo.estimated_cost, 25);
  assert.equal(todo.completed_at, "2026-03-18T09:30:00.000Z");
});
