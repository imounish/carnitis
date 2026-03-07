/**
 * Mock API layer – replace each function body with real Supabase queries.
 * Every function signature is production-ready; only the implementation is mocked.
 */

import type {
  Car,
  Entry,
  EntryType,
  MaintenanceScheduleItem,
  TodoItem,
} from "./schema";
import {
  mockCars,
  mockEntries,
  mockMaintenanceItems,
  mockTodos,
} from "./mock-data";

// Simulate async DB call
const delay = (ms = 50) => new Promise((r) => setTimeout(r, ms));

// ─── Cars ────────────────────────────────────────────────────

export async function getCars(): Promise<Car[]> {
  await delay();
  return [...mockCars];
}

export async function getCarById(id: string): Promise<Car | null> {
  await delay();
  return mockCars.find((c) => c.id === id) ?? null;
}

export async function createCar(
  car: Omit<Car, "id" | "created_at" | "updated_at" | "total_fuel_spent" | "total_maintenance_spent" | "total_improvements_spent" | "total_repairs_spent">
): Promise<Car> {
  await delay();
  const newCar: Car = {
    ...car,
    id: `car-${Date.now()}`,
    total_fuel_spent: 0,
    total_maintenance_spent: 0,
    total_improvements_spent: 0,
    total_repairs_spent: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  mockCars.push(newCar);
  return newCar;
}

export async function updateCar(
  id: string,
  updates: Partial<Car>
): Promise<Car | null> {
  await delay();
  const idx = mockCars.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  mockCars[idx] = { ...mockCars[idx], ...updates, updated_at: new Date().toISOString() };
  return mockCars[idx];
}

export async function deleteCar(id: string): Promise<boolean> {
  await delay();
  const idx = mockCars.findIndex((c) => c.id === id);
  if (idx === -1) return false;
  mockCars.splice(idx, 1);
  return true;
}

// ─── Entries ─────────────────────────────────────────────────

export async function getEntriesByCarId(
  carId: string,
  entryType?: EntryType
): Promise<Entry[]> {
  await delay();
  let entries = mockEntries.filter((e) => e.car_id === carId);
  if (entryType) entries = entries.filter((e) => e.entry_type === entryType);
  return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getRecentEntries(limit = 10): Promise<(Entry & { car?: Car })[]> {
  await delay();
  const sorted = [...mockEntries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
  return sorted.map((e) => ({
    ...e,
    car: mockCars.find((c) => c.id === e.car_id),
  }));
}

export async function createEntry(
  entry: Omit<Entry, "id" | "created_at" | "updated_at">
): Promise<Entry> {
  await delay();
  const newEntry: Entry = {
    ...entry,
    id: `entry-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  mockEntries.push(newEntry);

  // Update car mileage & totals
  const car = mockCars.find((c) => c.id === entry.car_id);
  if (car) {
    if (entry.mileage > car.current_mileage) {
      car.current_mileage = entry.mileage;
    }
    const amount = entry.expense_amount ?? entry.fuel_total_cost ?? 0;
    switch (entry.expense_category) {
      case "fuel":
        car.total_fuel_spent += amount;
        break;
      case "regular_maintenance":
      case "preventive_maintenance":
        car.total_maintenance_spent += amount;
        break;
      case "improvements":
        car.total_improvements_spent += amount;
        break;
      case "repairs":
        car.total_repairs_spent += amount;
        break;
    }
    car.updated_at = new Date().toISOString();
  }

  // Update maintenance schedule if linked
  if (entry.maintenance_item_id) {
    const item = mockMaintenanceItems.find((m) => m.id === entry.maintenance_item_id);
    if (item) {
      item.last_done_mileage = entry.mileage;
      item.last_done_date = entry.date;
      item.next_due_mileage = entry.mileage + item.interval_miles;
      if (item.interval_months) {
        const d = new Date(entry.date);
        d.setMonth(d.getMonth() + item.interval_months);
        item.next_due_date = d.toISOString().split("T")[0];
      }
      item.status = "upcoming";
      item.updated_at = new Date().toISOString();
    }
  }

  // Mark todo as completed if linked
  if (entry.todo_id) {
    const todo = mockTodos.find((t) => t.id === entry.todo_id);
    if (todo) {
      todo.status = "completed";
      todo.linked_entry_id = newEntry.id;
      todo.completed_at = new Date().toISOString();
      todo.updated_at = new Date().toISOString();
    }
  }

  return newEntry;
}

// ─── Maintenance Schedule ────────────────────────────────────

export async function getMaintenanceByCarId(
  carId: string
): Promise<MaintenanceScheduleItem[]> {
  await delay();
  return mockMaintenanceItems
    .filter((m) => m.car_id === carId)
    .sort((a, b) => {
      const order = { overdue: 0, due_soon: 1, upcoming: 2, completed: 3 };
      return order[a.status] - order[b.status];
    });
}

export async function getAllUpcomingMaintenance(): Promise<
  (MaintenanceScheduleItem & { car?: Car })[]
> {
  await delay();
  return mockMaintenanceItems
    .filter((m) => m.status !== "completed")
    .sort((a, b) => {
      const order = { overdue: 0, due_soon: 1, upcoming: 2, completed: 3 };
      return order[a.status] - order[b.status];
    })
    .map((m) => ({
      ...m,
      car: mockCars.find((c) => c.id === m.car_id),
    }));
}

export async function createMaintenanceItem(
  item: Omit<MaintenanceScheduleItem, "id" | "created_at" | "updated_at">
): Promise<MaintenanceScheduleItem> {
  await delay();
  const newItem: MaintenanceScheduleItem = {
    ...item,
    id: `maint-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  mockMaintenanceItems.push(newItem);
  return newItem;
}

export async function updateMaintenanceItem(
  id: string,
  updates: Partial<MaintenanceScheduleItem>
): Promise<MaintenanceScheduleItem | null> {
  await delay();
  const idx = mockMaintenanceItems.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  mockMaintenanceItems[idx] = {
    ...mockMaintenanceItems[idx],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  return mockMaintenanceItems[idx];
}

// ─── Todos ───────────────────────────────────────────────────

export async function getTodosByCarId(carId: string): Promise<TodoItem[]> {
  await delay();
  return mockTodos
    .filter((t) => t.car_id === carId)
    .sort((a, b) => {
      const pOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const sOrder = { in_progress: 0, pending: 1, completed: 2, cancelled: 3 };
      if (sOrder[a.status] !== sOrder[b.status]) return sOrder[a.status] - sOrder[b.status];
      return pOrder[a.priority] - pOrder[b.priority];
    });
}

export async function getAllTodos(): Promise<(TodoItem & { car?: Car })[]> {
  await delay();
  return mockTodos
    .filter((t) => t.status !== "completed" && t.status !== "cancelled")
    .sort((a, b) => {
      const pOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return pOrder[a.priority] - pOrder[b.priority];
    })
    .map((t) => ({
      ...t,
      car: mockCars.find((c) => c.id === t.car_id),
    }));
}

export async function createTodo(
  todo: Omit<TodoItem, "id" | "created_at" | "updated_at" | "completed_at" | "linked_entry_id">
): Promise<TodoItem> {
  await delay();
  const newTodo: TodoItem = {
    ...todo,
    linked_entry_id: null,
    completed_at: null,
    id: `todo-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  mockTodos.push(newTodo);
  return newTodo;
}

export async function updateTodo(
  id: string,
  updates: Partial<TodoItem>
): Promise<TodoItem | null> {
  await delay();
  const idx = mockTodos.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  mockTodos[idx] = {
    ...mockTodos[idx],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  return mockTodos[idx];
}

// ─── Stats / Computed ────────────────────────────────────────

export async function getCarStats(carId: string) {
  await delay();
  const car = mockCars.find((c) => c.id === carId);
  if (!car) return null;

  const entries = mockEntries.filter((e) => e.car_id === carId);
  const fuelEntries = entries.filter((e) => e.entry_type === "fuel");
  const maintenanceItems = mockMaintenanceItems.filter(
    (m) => m.car_id === carId
  );
  const todos = mockTodos.filter((t) => t.car_id === carId);

  // Compute fuel economy (last 5 fill-ups)
  const recentFuel = fuelEntries
    .filter((e) => e.was_full_tank)
    .sort((a, b) => b.mileage - a.mileage)
    .slice(0, 5);

  let avgMpg = 0;
  if (recentFuel.length >= 2) {
    const totalMiles = recentFuel[0].mileage - recentFuel[recentFuel.length - 1].mileage;
    const totalGallons = recentFuel
      .slice(0, -1)
      .reduce((sum, e) => sum + (e.fuel_gallons ?? 0), 0);
    avgMpg = totalGallons > 0 ? totalMiles / totalGallons : 0;
  }

  const totalSpent =
    car.total_fuel_spent +
    car.total_maintenance_spent +
    car.total_improvements_spent +
    car.total_repairs_spent;

  const dueSoonCount = maintenanceItems.filter(
    (m) => m.status === "due_soon" || m.status === "overdue"
  ).length;

  const pendingTodos = todos.filter(
    (t) => t.status === "pending" || t.status === "in_progress"
  ).length;

  // Estimate miles until empty (rough: last fill-up gallons * avg mpg)
  const lastFuel = recentFuel[0];
  const milesSinceLastFill = lastFuel
    ? car.current_mileage - lastFuel.mileage
    : 0;
  const estimatedRange = avgMpg > 0 && car.fuel_tank_capacity
    ? car.fuel_tank_capacity * avgMpg - milesSinceLastFill
    : null;

  // Monthly spending (last 6 months)
  const now = new Date();
  const monthlySpending = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthEntries = entries.filter((e) => e.date.startsWith(monthKey));
    const fuel = monthEntries
      .filter((e) => e.expense_category === "fuel")
      .reduce((s, e) => s + (e.expense_amount ?? 0), 0);
    const maintenance = monthEntries
      .filter((e) => e.expense_category === "regular_maintenance" || e.expense_category === "preventive_maintenance")
      .reduce((s, e) => s + (e.expense_amount ?? 0), 0);
    const other = monthEntries
      .filter((e) => e.expense_category === "improvements" || e.expense_category === "repairs")
      .reduce((s, e) => s + (e.expense_amount ?? 0), 0);
    return {
      month: d.toLocaleString("default", { month: "short" }),
      fuel,
      maintenance,
      other,
    };
  }).reverse();

  return {
    totalSpent,
    avgMpg: Math.round(avgMpg * 10) / 10,
    estimatedRange: estimatedRange ? Math.max(0, Math.round(estimatedRange)) : null,
    dueSoonCount,
    pendingTodos,
    monthlySpending,
    fuelEntryCount: fuelEntries.length,
    totalEntries: entries.length,
    costPerMile:
      car.current_mileage > 0
        ? Math.round((totalSpent / car.current_mileage) * 100) / 100
        : 0,
  };
}

export async function getDashboardStats() {
  await delay();
  const totalCars = mockCars.length;
  const totalSpent = mockCars.reduce(
    (s, c) =>
      s +
      c.total_fuel_spent +
      c.total_maintenance_spent +
      c.total_improvements_spent +
      c.total_repairs_spent,
    0
  );
  const upcomingMaintenance = mockMaintenanceItems.filter(
    (m) => m.status === "due_soon" || m.status === "overdue"
  ).length;
  const pendingTodos = mockTodos.filter(
    (t) => t.status === "pending" || t.status === "in_progress"
  ).length;

  return { totalCars, totalSpent, upcomingMaintenance, pendingTodos };
}
