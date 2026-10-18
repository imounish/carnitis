import assert from "node:assert/strict";
import test from "node:test";
import {
  getDashboardStatsFromDataAccess,
  getCarStatsFromDataAccess,
} from "../lib/db/stats-service.ts";

function createMockCar(overrides = {}) {
  return {
    id: "car-1",
    name: "Test Car",
    make: "Toyota",
    model: "Camry",
    year: 2020,
    vin: null,
    color: null,
    license_plate: null,
    current_mileage: 50000,
    fuel_tank_capacity: 14.5,
    fuel_type: "gasoline",
    total_fuel_spent: 1000,
    total_maintenance_spent: 500,
    total_improvements_spent: 200,
    total_repairs_spent: 100,
    image_url: null,
    notes: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-03-01T00:00:00.000Z",
    ...overrides,
  };
}

function createFuelEntry(overrides = {}) {
  return {
    id: "entry",
    car_id: "car-1",
    entry_type: "fuel",
    date: "2026-03-01",
    mileage: 0,
    fuel_gallons: 10,
    was_full_tank: true,
    fuel_level_before: null,
    expense_category: "fuel",
    expense_amount: 35,
    ...overrides,
  };
}

function createFakeDataAccess({ cars = [], entries = [], maintenance = [], todos = [] } = {}) {
  return {
    cars: {
      list: async () => cars,
      getById: async (id) => cars.find((c) => c.id === id) ?? null,
      create: async () => { throw new Error("not implemented"); },
      update: async () => { throw new Error("not implemented"); },
      delete: async () => { throw new Error("not implemented"); },
    },
    entries: {
      listByCarId: async () => entries,
      listRecent: async () => entries,
      create: async () => { throw new Error("not implemented"); },
    },
    maintenance: {
      listByCarId: async () => maintenance,
      getById: async () => null,
      listUpcoming: async () => maintenance,
      create: async () => { throw new Error("not implemented"); },
      update: async () => { throw new Error("not implemented"); },
      delete: async () => { throw new Error("not implemented"); },
    },
    todos: {
      listByCarId: async () => todos,
      listAll: async () => todos,
      create: async () => { throw new Error("not implemented"); },
      update: async () => { throw new Error("not implemented"); },
      delete: async () => { throw new Error("not implemented"); },
    },
  };
}

test("getDashboardStatsFromDataAccess aggregates stats from real data shape", async () => {
  const car1 = createMockCar({ id: "car-1", total_fuel_spent: 500, total_maintenance_spent: 300 });
  const car2 = createMockCar({ id: "car-2", total_fuel_spent: 700, total_maintenance_spent: 200 });

  const dataAccess = createFakeDataAccess({
    cars: [car1, car2],
    maintenance: [
      { id: "m-1", status: "due_soon", car: car1 },
      { id: "m-2", status: "upcoming", car: car2 },
      { id: "m-3", status: "overdue", car: car1 },
    ],
    todos: [
      { id: "t-1", status: "pending" },
      { id: "t-2", status: "completed" },
      { id: "t-3", status: "in_progress" },
    ],
  });

  const stats = await getDashboardStatsFromDataAccess(dataAccess);

  assert.equal(stats.totalCars, 2);
  assert.equal(stats.totalSpent, 2300); // (500+300+200+100) + (700+200+200+100)
  assert.equal(stats.upcomingMaintenance, 2); // due_soon + overdue
  assert.equal(stats.pendingTodos, 2); // pending + in_progress
});

test("getDashboardStatsFromDataAccess handles empty data", async () => {
  const dataAccess = createFakeDataAccess();
  const stats = await getDashboardStatsFromDataAccess(dataAccess);

  assert.equal(stats.totalCars, 0);
  assert.equal(stats.totalSpent, 0);
  assert.equal(stats.upcomingMaintenance, 0);
  assert.equal(stats.pendingTodos, 0);
});

test("getCarStatsFromDataAccess returns null for missing car", async () => {
  const dataAccess = createFakeDataAccess();
  const result = await getCarStatsFromDataAccess(dataAccess, "nonexistent");
  assert.equal(result, null);
});

test("getCarStatsFromDataAccess computes totals for existing car", async () => {
  const car = createMockCar();
  const dataAccess = createFakeDataAccess({
    cars: [car],
    entries: [
      {
        id: "e-1",
        car_id: "car-1",
        entry_type: "fuel",
        date: "2026-03-01",
        mileage: 49800,
        fuel_gallons: 10,
        was_full_tank: true,
        fuel_level_before: null,
        expense_category: "fuel",
        expense_amount: 35,
      },
      {
        id: "e-2",
        car_id: "car-1",
        entry_type: "fuel",
        date: "2026-03-10",
        mileage: 50000,
        fuel_gallons: 8,
        was_full_tank: true,
        fuel_level_before: null,
        expense_category: "fuel",
        expense_amount: 30,
      },
    ],
    maintenance: [
      { id: "m-1", status: "due_soon" },
      { id: "m-2", status: "upcoming" },
    ],
    todos: [
      { id: "t-1", status: "pending" },
    ],
  });

  const stats = await getCarStatsFromDataAccess(dataAccess, "car-1");

  assert.equal(stats.totalSpent, 1800); // 1000+500+200+100
  assert.equal(stats.dueSoonCount, 1); // only due_soon
  assert.equal(stats.pendingTodos, 1);
  assert.equal(stats.totalEntries, 2);
  assert.equal(stats.fuelEntryCount, 2);
  assert.equal(stats.avgMpg, 25);
  assert.equal(stats.estimatedRange, 363);
});

test("getCarStatsFromDataAccess estimates range from fuel level before partial fill", async () => {
  const car = createMockCar({
    current_mileage: 50100,
    fuel_tank_capacity: 20,
  });
  const dataAccess = createFakeDataAccess({
    cars: [car],
    entries: [
      {
        id: "e-1",
        car_id: "car-1",
        entry_type: "fuel",
        date: "2026-03-01",
        mileage: 48800,
        fuel_gallons: 10,
        was_full_tank: true,
        fuel_level_before: null,
        expense_category: "fuel",
        expense_amount: 35,
      },
      {
        id: "e-2",
        car_id: "car-1",
        entry_type: "fuel",
        date: "2026-03-10",
        mileage: 49000,
        fuel_gallons: 10,
        was_full_tank: true,
        fuel_level_before: null,
        expense_category: "fuel",
        expense_amount: 30,
      },
      {
        id: "e-3",
        car_id: "car-1",
        entry_type: "fuel",
        date: "2026-03-17",
        mileage: 50000,
        fuel_gallons: 5,
        was_full_tank: false,
        fuel_level_before: 25,
        expense_category: "fuel",
        expense_amount: 20,
      },
    ],
  });

  const stats = await getCarStatsFromDataAccess(dataAccess, "car-1");

  assert.equal(stats.avgMpg, 20);
  assert.equal(stats.estimatedRange, 100);
});

test("getCarStatsFromDataAccess falls back to an older fuel entry with a level signal", async () => {
  const car = createMockCar({
    current_mileage: 50100,
    fuel_tank_capacity: 20,
  });
  const dataAccess = createFakeDataAccess({
    cars: [car],
    entries: [
      {
        id: "e-1",
        car_id: "car-1",
        entry_type: "fuel",
        date: "2026-03-01",
        mileage: 48800,
        fuel_gallons: 10,
        was_full_tank: true,
        fuel_level_before: null,
        expense_category: "fuel",
        expense_amount: 35,
      },
      {
        id: "e-2",
        car_id: "car-1",
        entry_type: "fuel",
        date: "2026-03-10",
        mileage: 49000,
        fuel_gallons: 10,
        was_full_tank: true,
        fuel_level_before: null,
        expense_category: "fuel",
        expense_amount: 30,
      },
      {
        id: "e-3",
        car_id: "car-1",
        entry_type: "fuel",
        date: "2026-03-17",
        mileage: 50000,
        fuel_gallons: 5,
        was_full_tank: false,
        fuel_level_before: null,
        expense_category: "fuel",
        expense_amount: 20,
      },
    ],
  });

  const stats = await getCarStatsFromDataAccess(dataAccess, "car-1");

  assert.equal(stats.avgMpg, 20);
  assert.equal(stats.estimatedRange, 0);
});

test("getCarStatsFromDataAccess orders usable range signals by date before mileage", async () => {
  const car = createMockCar({
    current_mileage: 1000,
    fuel_tank_capacity: 20,
  });
  const dataAccess = createFakeDataAccess({
    cars: [car],
    entries: [
      createFuelEntry({
        id: "full-1",
        date: "2026-03-01",
        mileage: 1000,
        fuel_gallons: 10,
      }),
      createFuelEntry({
        id: "full-2",
        date: "2026-02-20",
        mileage: 800,
        fuel_gallons: 10,
      }),
      createFuelEntry({
        id: "newer-by-date",
        date: "2026-03-20",
        mileage: 900,
        fuel_gallons: 0,
        was_full_tank: false,
        fuel_level_before: 50,
      }),
      createFuelEntry({
        id: "older-by-date-higher-mileage",
        date: "2026-03-10",
        mileage: 1100,
        fuel_gallons: 0,
        was_full_tank: false,
        fuel_level_before: 10,
      }),
    ],
  });

  const stats = await getCarStatsFromDataAccess(dataAccess, "car-1");

  assert.equal(stats.avgMpg, 20);
  assert.equal(stats.estimatedRange, 100);
});

test("getCarStatsFromDataAccess gives full-tank entries priority over fuel level before fill", async () => {
  const car = createMockCar({
    current_mileage: 50100,
    fuel_tank_capacity: 20,
  });
  const dataAccess = createFakeDataAccess({
    cars: [car],
    entries: [
      createFuelEntry({
        id: "full-1",
        date: "2026-03-01",
        mileage: 49600,
      }),
      createFuelEntry({
        id: "full-2",
        date: "2026-03-10",
        mileage: 49800,
      }),
      createFuelEntry({
        id: "conflicting-latest",
        date: "2026-03-17",
        mileage: 50000,
        was_full_tank: true,
        fuel_level_before: 25,
      }),
    ],
  });

  const stats = await getCarStatsFromDataAccess(dataAccess, "car-1");

  assert.equal(stats.avgMpg, 20);
  assert.equal(stats.estimatedRange, 300);
});

test("getCarStatsFromDataAccess caps partial-fill gallons at tank capacity", async () => {
  const car = createMockCar({
    current_mileage: 50000,
    fuel_tank_capacity: 20,
  });
  const dataAccess = createFakeDataAccess({
    cars: [car],
    entries: [
      createFuelEntry({
        id: "full-1",
        date: "2026-03-01",
        mileage: 48800,
      }),
      createFuelEntry({
        id: "full-2",
        date: "2026-03-10",
        mileage: 49000,
      }),
      createFuelEntry({
        id: "over-capacity",
        date: "2026-03-17",
        mileage: 50000,
        fuel_gallons: 10,
        was_full_tank: false,
        fuel_level_before: 80,
      }),
    ],
  });

  const stats = await getCarStatsFromDataAccess(dataAccess, "car-1");

  assert.equal(stats.avgMpg, 20);
  assert.equal(stats.estimatedRange, 400);
});

test("getCarStatsFromDataAccess uses zero percent fuel level before fill", async () => {
  const car = createMockCar({
    current_mileage: 50050,
    fuel_tank_capacity: 20,
  });
  const dataAccess = createFakeDataAccess({
    cars: [car],
    entries: [
      createFuelEntry({
        id: "full-1",
        date: "2026-03-01",
        mileage: 48800,
      }),
      createFuelEntry({
        id: "full-2",
        date: "2026-03-10",
        mileage: 49000,
      }),
      createFuelEntry({
        id: "empty-before-fill",
        date: "2026-03-17",
        mileage: 50000,
        fuel_gallons: 5,
        was_full_tank: false,
        fuel_level_before: 0,
      }),
    ],
  });

  const stats = await getCarStatsFromDataAccess(dataAccess, "car-1");

  assert.equal(stats.avgMpg, 20);
  assert.equal(stats.estimatedRange, 50);
});

test("getCarStatsFromDataAccess returns null range for partial fill without tank capacity", async () => {
  const car = createMockCar({
    current_mileage: 50050,
    fuel_tank_capacity: null,
  });
  const dataAccess = createFakeDataAccess({
    cars: [car],
    entries: [
      createFuelEntry({
        id: "full-1",
        date: "2026-03-01",
        mileage: 48800,
      }),
      createFuelEntry({
        id: "full-2",
        date: "2026-03-10",
        mileage: 49000,
      }),
      createFuelEntry({
        id: "partial",
        date: "2026-03-17",
        mileage: 50000,
        fuel_gallons: 5,
        was_full_tank: false,
        fuel_level_before: 25,
      }),
    ],
  });

  const stats = await getCarStatsFromDataAccess(dataAccess, "car-1");

  assert.equal(stats.avgMpg, 20);
  assert.equal(stats.estimatedRange, null);
});

test("getCarStatsFromDataAccess returns null range for partial fill without average mpg", async () => {
  const car = createMockCar({
    current_mileage: 50050,
    fuel_tank_capacity: 20,
  });
  const dataAccess = createFakeDataAccess({
    cars: [car],
    entries: [
      createFuelEntry({
        id: "partial",
        date: "2026-03-17",
        mileage: 50000,
        fuel_gallons: 5,
        was_full_tank: false,
        fuel_level_before: 25,
      }),
    ],
  });

  const stats = await getCarStatsFromDataAccess(dataAccess, "car-1");

  assert.equal(stats.avgMpg, 0);
  assert.equal(stats.estimatedRange, null);
});

test("getCarStatsFromDataAccess returns null range when no fuel entry has a level signal", async () => {
  const car = createMockCar({
    current_mileage: 50100,
    fuel_tank_capacity: 20,
  });
  const dataAccess = createFakeDataAccess({
    cars: [car],
    entries: [
      createFuelEntry({
        id: "partial-1",
        date: "2026-03-01",
        mileage: 48800,
        fuel_gallons: 10,
        was_full_tank: false,
        fuel_level_before: null,
      }),
      createFuelEntry({
        id: "partial-2",
        date: "2026-03-17",
        mileage: 50000,
        fuel_gallons: 5,
        was_full_tank: false,
        fuel_level_before: null,
      }),
    ],
  });

  const stats = await getCarStatsFromDataAccess(dataAccess, "car-1");

  assert.equal(stats.avgMpg, 0);
  assert.equal(stats.estimatedRange, null);
});
