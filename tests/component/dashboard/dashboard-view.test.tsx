import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import type { Car, Entry, MaintenanceScheduleItem, TodoItem } from "@/lib/db/schema";

vi.mock("@/components/dashboard/expense-donut-chart", () => ({
  ExpenseDonutChart: () => <div data-testid="expense-donut-chart" />,
}));

const car: Car = {
  id: "car-1",
  name: "Daily Driver",
  make: "Toyota",
  model: "Camry",
  year: 2020,
  vin: null,
  color: null,
  license_plate: null,
  current_mileage: 50000,
  mileage_as_of_date: "2026-03-01",
  mileage_check_interval_days: 14,
  fuel_tank_capacity: 14.5,
  fuel_type: "gasoline",
  total_fuel_spent: 1200,
  total_maintenance_spent: 800,
  total_improvements_spent: 300,
  total_repairs_spent: 200,
  image_url: null,
  notes: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-03-01T00:00:00.000Z",
};

const entry: Entry & { car?: Car } = {
  id: "entry-1",
  car_id: car.id,
  entry_type: "fuel",
  date: "2026-03-15",
  mileage: 50100,
  fuel_gallons: 10,
  fuel_price_per_gallon: 3.5,
  fuel_total_cost: 35,
  fuel_station: null,
  fuel_octane: null,
  was_full_tank: true,
  fuel_level_before: null,
  expense_category: "fuel",
  expense_amount: 35,
  description: null,
  vendor: "Shell",
  parts_replaced: null,
  maintenance_item_id: null,
  todo_id: null,
  notes: null,
  created_at: "2026-03-15T10:00:00.000Z",
  updated_at: "2026-03-15T10:00:00.000Z",
  car,
};

const maintenanceItem: MaintenanceScheduleItem & { car?: Car } = {
  id: "maint-1",
  car_id: car.id,
  name: "Oil Change",
  description: null,
  interval_miles: 5000,
  interval_months: 6,
  last_done_mileage: 45000,
  last_done_date: "2025-12-01",
  next_due_mileage: 50000,
  next_due_date: "2026-06-01",
  estimated_cost: 50,
  notes: null,
  status: "due_soon",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-03-01T00:00:00.000Z",
  car,
};

const todoItem: TodoItem & { car?: Car } = {
  id: "todo-1",
  car_id: car.id,
  title: "Replace wipers",
  description: null,
  priority: "medium",
  status: "pending",
  category: "regular_maintenance",
  estimated_cost: 25,
  linked_entry_id: null,
  due_date: "2026-04-01",
  completed_at: null,
  created_at: "2026-03-01T00:00:00.000Z",
  updated_at: "2026-03-01T00:00:00.000Z",
  car,
};

const defaultProps = {
  stats: {
    totalCars: 1,
    totalSpent: 2500,
    upcomingMaintenance: 1,
    pendingTodos: 1,
  },
  cars: [car],
  recentEntries: [entry],
  maintenanceAlerts: [maintenanceItem],
  todos: [todoItem],
};

function renderDashboard(
  overrides?: Partial<React.ComponentProps<typeof DashboardView>>
) {
  return render(<DashboardView {...defaultProps} {...overrides} />);
}

describe("DashboardView", () => {
  it("renders stat cards with correct values", () => {
    renderDashboard();
    expect(screen.getByText("$2,500.00")).toBeTruthy();
    expect(screen.getByText("Needs attention")).toBeTruthy();
    expect(screen.getByText("Vehicles")).toBeTruthy();
    expect(screen.getByText("Total Spent")).toBeTruthy();
    expect(screen.getByText("Service Due")).toBeTruthy();
    expect(screen.getByText("Open Tasks")).toBeTruthy();
  });

  it("renders car section", () => {
    renderDashboard();
    expect(screen.getByText("My Cars")).toBeTruthy();
  });

  it("renders recent entries", () => {
    renderDashboard();
    expect(screen.getByText("Recent Entries")).toBeTruthy();
  });

  it("renders maintenance alerts", () => {
    renderDashboard();
    expect(screen.getByText("Maintenance Alerts")).toBeTruthy();
    expect(screen.getByText("Oil Change")).toBeTruthy();
  });

  it("renders todo items", () => {
    renderDashboard();
    expect(screen.getByText("To-Do Items")).toBeTruthy();
    expect(screen.getByText("Replace wipers")).toBeTruthy();
  });

  it("renders expense donut chart", () => {
    renderDashboard();
    expect(screen.getByTestId("expense-donut-chart")).toBeTruthy();
  });

  it("shows empty states when no data", () => {
    renderDashboard({
      stats: {
        totalCars: 0,
        totalSpent: 0,
        upcomingMaintenance: 0,
        pendingTodos: 0,
      },
      cars: [],
      recentEntries: [],
      maintenanceAlerts: [],
      todos: [],
    });

    expect(screen.getByText("All clear")).toBeTruthy();
    expect(screen.getByText("No upcoming maintenance.")).toBeTruthy();
    expect(screen.getByText("No pending tasks.")).toBeTruthy();
    expect(
      screen.getByText("No entries yet. Start by logging your first expense.")
    ).toBeTruthy();
  });

  it("renders quick action links", () => {
    renderDashboard();
    expect(screen.getByText("Log Fuel Stop")).toBeTruthy();
    expect(screen.getByText("Log Maintenance")).toBeTruthy();
    expect(screen.getByText("Add New Car")).toBeTruthy();
  });
});
