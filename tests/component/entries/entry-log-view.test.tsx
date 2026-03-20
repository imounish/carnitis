import * as React from "react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { EntryLogView } from "@/components/entries/entry-log-view";
import { server } from "@/tests/component/msw/server";
import type { Car, MaintenanceScheduleItem, TodoItem } from "@/lib/db/schema";

const routerSpies = vi.hoisted(() => ({
  refresh: vi.fn(),
  replace: vi.fn(),
}));

const toastSpies = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerSpies,
}));

vi.mock("sonner", () => ({
  toast: toastSpies,
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
  current_mileage: 12340,
  fuel_tank_capacity: 14.5,
  fuel_type: "gasoline",
  total_fuel_spent: 0,
  total_maintenance_spent: 0,
  total_improvements_spent: 0,
  total_repairs_spent: 0,
  image_url: null,
  notes: null,
  created_at: "2026-03-01T10:00:00.000Z",
  updated_at: "2026-03-10T10:00:00.000Z",
};

const maintenanceItem: MaintenanceScheduleItem = {
  id: "maintenance-1",
  car_id: car.id,
  name: "Oil Change",
  description: null,
  interval_miles: 5000,
  interval_months: 6,
  last_done_mileage: 12000,
  last_done_date: "2026-01-10",
  next_due_mileage: 17000,
  next_due_date: "2026-07-10",
  status: "due_soon",
  estimated_cost: 80,
  notes: null,
  created_at: "2026-01-01T10:00:00.000Z",
  updated_at: "2026-03-10T10:00:00.000Z",
};

const todoItem: TodoItem = {
  id: "todo-1",
  car_id: car.id,
  title: "Check cabin air filter",
  description: null,
  priority: "medium",
  status: "pending",
  category: "regular_maintenance",
  estimated_cost: 25,
  linked_entry_id: null,
  due_date: "2026-03-20",
  completed_at: null,
  created_at: "2026-03-01T10:00:00.000Z",
  updated_at: "2026-03-10T10:00:00.000Z",
};

function renderView() {
  return render(
    <EntryLogView
      cars={[car]}
      selectedCarId={car.id}
      selectedCar={car}
      maintenanceItems={[maintenanceItem]}
      todoItems={[todoItem]}
      recentEntries={[]}
    />
  );
}

describe("EntryLogView success path", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-03-18T15:30:00.000Z"));
    routerSpies.refresh.mockReset();
    routerSpies.replace.mockReset();
    toastSpies.success.mockReset();
    toastSpies.error.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("submits the default fuel form, resets fields, and refreshes the route", async () => {
    let capturedPayload: Record<string, unknown> | null = null;

    server.use(
      http.post("/api/entries", async ({ request }) => {
        capturedPayload = (await request.json()) as Record<string, unknown>;
        await new Promise((resolve) => setTimeout(resolve, 25));
        return HttpResponse.json({ data: { id: "entry-1" } });
      })
    );

    const user = userEvent.setup();

    renderView();

    await user.type(screen.getByLabelText(/Odometer/i), "12390");
    await user.type(screen.getByLabelText(/Gallons/i), "11.5");
    await user.type(screen.getByLabelText(/\$\/Gallon/i), "3.499");
    await user.type(screen.getByLabelText(/Station/i), "Shell");
    await user.type(screen.getByLabelText(/Notes/i), "Top off before trip");

    await user.click(screen.getByRole("button", { name: /Save Entry/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Saving/i })).toBeTruthy();
    });

    await waitFor(() => {
      expect(routerSpies.refresh).toHaveBeenCalledTimes(1);
    });

    expect(capturedPayload).toEqual({
      car_id: "car-1",
      entry_type: "fuel",
      date: "2026-03-18",
      mileage: 12390,
      fuel_gallons: 11.5,
      fuel_price_per_gallon: 3.499,
      fuel_total_cost: 40.24,
      fuel_station: "Shell",
      fuel_octane: "87",
      was_full_tank: true,
      expense_category: "fuel",
      expense_amount: 40.24,
      description: "Fuel - 11.5 gal",
      vendor: "Shell",
      parts_replaced: null,
      maintenance_item_id: null,
      todo_id: null,
      notes: "Top off before trip",
    });

    expect(toastSpies.success).toHaveBeenCalledWith("Entry logged!", {
      description: "Updated Daily Driver to 12,390 mi",
    });
    expect(toastSpies.error).not.toHaveBeenCalled();

    expect(
      (screen.getByLabelText(/Date/i) as HTMLInputElement).value
    ).toBe("2026-03-18");
    expect(
      (screen.getByLabelText(/Odometer/i) as HTMLInputElement).value
    ).toBe("");
    expect(
      (screen.getByLabelText(/Gallons/i) as HTMLInputElement).value
    ).toBe("");
    expect(
      (screen.getByLabelText(/\$\/Gallon/i) as HTMLInputElement).value
    ).toBe("");
    expect(
      (screen.getByLabelText(/Station/i) as HTMLInputElement).value
    ).toBe("");
    expect(
      (screen.getByLabelText(/Notes/i) as HTMLTextAreaElement).value
    ).toBe("");

    const submitButton = screen.getByRole("button", { name: /Save Entry/i });
    expect((submitButton as HTMLButtonElement).disabled).toBe(false);
  });

  it("submits maintenance-done with advanced links visible, then collapses the advanced section and refreshes", async () => {
    let capturedPayload: Record<string, unknown> | null = null;

    server.use(
      http.post("/api/entries", async ({ request }) => {
        capturedPayload = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ data: { id: "entry-2" } });
      })
    );

    const user = userEvent.setup();

    renderView();

    await user.click(screen.getAllByRole("button", { name: "Service" })[0]);
    await user.type(screen.getByLabelText(/Odometer/i), "12450");
    await user.type(screen.getByLabelText(/^Description/i), "Oil change");
    await user.click(
      screen.getByRole("button", { name: /Link to schedule \/ task/i })
    );

    expect(
      screen.getByText(/Resets the maintenance interval on the linked item/i)
    ).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /Save Entry/i }));
    await waitFor(() => {
      expect(routerSpies.refresh).toHaveBeenCalledTimes(1);
    });

    expect(capturedPayload).toEqual({
      car_id: "car-1",
      entry_type: "maintenance_done",
      date: "2026-03-18",
      mileage: 12450,
      fuel_gallons: null,
      fuel_price_per_gallon: null,
      fuel_total_cost: null,
      fuel_station: null,
      fuel_octane: null,
      was_full_tank: null,
      expense_category: "regular_maintenance",
      expense_amount: null,
      description: "Oil change",
      vendor: null,
      parts_replaced: null,
      maintenance_item_id: null,
      todo_id: null,
      notes: null,
    });

    expect(toastSpies.success).toHaveBeenCalledWith("Entry logged!", {
      description: "Updated Daily Driver to 12,450 mi",
    });
    expect(
      screen.queryByText(/Resets the maintenance interval on the linked item/i)
    ).toBeNull();
    expect(
      (screen.getByLabelText(/Date/i) as HTMLInputElement).value
    ).toBe("2026-03-18");
    expect(
      (screen.getByLabelText(/Odometer/i) as HTMLInputElement).value
    ).toBe("");
    expect(
      (screen.getByLabelText(/^Description/i) as HTMLInputElement).value
    ).toBe("");
  });
});
