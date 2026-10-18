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
  mileage_as_of_date: "2026-03-10",
  mileage_check_interval_days: 14,
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

function renderView(
  overrides?: Partial<React.ComponentProps<typeof EntryLogView>>
) {
  return render(
    <EntryLogView
      cars={[car]}
      selectedCarId={car.id}
      selectedCar={car}
      maintenanceItems={[maintenanceItem]}
      todoItems={[todoItem]}
      entries={[]}
      {...overrides}
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
    await user.type(screen.getByLabelText(/Fuel level before fill/i), "25");
    await user.type(screen.getByLabelText(/Notes/i), "Top off before trip");

    await user.click(screen.getByRole("button", { name: /Save Entry/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Saving/i })).toBeTruthy();
    });

    await waitFor(() => {
      expect(routerSpies.refresh).toHaveBeenCalledTimes(1);
    });
    expect(routerSpies.replace).toHaveBeenCalledWith("/entries?car=car-1", {
      scroll: false,
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
      fuel_level_before: 25,
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
      (screen.getByLabelText(/Fuel level before fill/i) as HTMLInputElement).value
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
    expect(routerSpies.replace).toHaveBeenCalledWith("/entries?car=car-1", {
      scroll: false,
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
      fuel_level_before: null,
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

  it("prefills service mode from maintenance and keeps the linked item in the payload", async () => {
    let capturedPayload: Record<string, unknown> | null = null;

    server.use(
      http.post("/api/entries", async ({ request }) => {
        capturedPayload = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ data: { id: "entry-3" } });
      })
    );

    const user = userEvent.setup();

    render(
      <EntryLogView
        cars={[car]}
        selectedCarId={car.id}
        selectedCar={car}
        maintenanceItems={[maintenanceItem]}
        todoItems={[todoItem]}
        entries={[]}
        initialEntryType="maintenance_done"
        initialShowAdvanced
        preselectedMaintenanceItemId={maintenanceItem.id}
      />
    );

    expect(
      screen.getByText(/Resets the maintenance interval on the linked item/i)
    ).toBeTruthy();

    await user.type(screen.getByLabelText(/Odometer/i), "12480");
    await user.type(screen.getByLabelText(/^Description/i), "Linked service");
    await user.click(screen.getByRole("button", { name: /Save Entry/i }));

    await waitFor(() => {
      expect(routerSpies.refresh).toHaveBeenCalledTimes(1);
    });

    expect(capturedPayload).toMatchObject({
      car_id: "car-1",
      entry_type: "maintenance_done",
      maintenance_item_id: maintenanceItem.id,
      mileage: 12480,
      description: "Linked service",
    });
    expect(routerSpies.replace).toHaveBeenCalledWith("/entries?car=car-1", {
      scroll: false,
    });
  });

  it("prefills a todo item and keeps it linked in the submitted payload", async () => {
    let capturedPayload: Record<string, unknown> | null = null;

    server.use(
      http.post("/api/entries", async ({ request }) => {
        capturedPayload = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ data: { id: "entry-4" } });
      })
    );

    const user = userEvent.setup();

    renderView({
      initialEntryType: "maintenance_expense",
      initialShowAdvanced: true,
      preselectedTodoItemId: todoItem.id,
    });

    expect(screen.getByDisplayValue("Check cabin air filter")).toBeTruthy();

    await user.type(screen.getByLabelText(/Odometer/i), "12410");
    await user.type(screen.getByLabelText(/Amount/i), "42.50");
    await user.type(
      screen.getByLabelText(/^Description/i),
      "Cabin filter replacement"
    );
    await user.click(screen.getByRole("button", { name: /Save Entry/i }));

    await waitFor(() => {
      expect(routerSpies.refresh).toHaveBeenCalledTimes(1);
    });

    expect(capturedPayload).toEqual({
      car_id: "car-1",
      entry_type: "maintenance_expense",
      date: "2026-03-18",
      mileage: 12410,
      fuel_gallons: null,
      fuel_price_per_gallon: null,
      fuel_total_cost: null,
      fuel_station: null,
      fuel_octane: null,
      was_full_tank: null,
      fuel_level_before: null,
      expense_category: "regular_maintenance",
      expense_amount: 42.5,
      description: "Cabin filter replacement",
      vendor: null,
      parts_replaced: null,
      maintenance_item_id: null,
      todo_id: "todo-1",
      notes: null,
    });
    expect(routerSpies.replace).toHaveBeenCalledWith("/entries?car=car-1", {
      scroll: false,
    });
  });
});

function makeEntry(id: string, date: string, mileage: number) {
  return {
    id,
    car_id: car.id,
    entry_type: "fuel" as const,
    date,
    mileage,
    fuel_gallons: null,
    fuel_price_per_gallon: null,
    fuel_total_cost: null,
    fuel_station: null,
    fuel_octane: null,
    was_full_tank: null,
    fuel_level_before: null,
    expense_category: null,
    expense_amount: null,
    description: null,
    vendor: null,
    parts_replaced: null,
    maintenance_item_id: null,
    todo_id: null,
    notes: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

describe("EntryLogView mileage bounds validation", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-03-18T15:30:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows a 'too low' error and disables submit when mileage is below lower bound", async () => {
    const priorEntry = makeEntry("e1", "2026-03-10", 12500);

    renderView({ entries: [priorEntry] });

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/Odometer/i), "12300");

    expect(screen.getByText(/Must be at least 12,500 mi/i)).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: /Save Entry/i }) as HTMLButtonElement).disabled
    ).toBe(true);
  });

  it("shows a 'too high' error and disables submit when mileage is above upper bound", async () => {
    const futureEntry = makeEntry("e1", "2026-03-25", 12800);

    renderView({ entries: [futureEntry] });

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/Odometer/i), "13000");

    expect(screen.getByText(/Must be at most 12,800 mi/i)).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: /Save Entry/i }) as HTMLButtonElement).disabled
    ).toBe(true);
  });

  it("shows no error and submit is enabled when mileage is within bounds", async () => {
    const priorEntry = makeEntry("e1", "2026-03-10", 12300);
    const futureEntry = makeEntry("e2", "2026-03-25", 12800);

    renderView({ entries: [priorEntry, futureEntry] });

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/Odometer/i), "12500");

    expect(screen.queryByText(/Must be/i)).toBeNull();
    expect(
      (screen.getByRole("button", { name: /Save Entry/i }) as HTMLButtonElement).disabled
    ).toBe(false);
  });

  it("recomputes bounds when the date changes", async () => {
    const priorEntry = makeEntry("e1", "2026-03-10", 12000);
    const midEntry = makeEntry("e2", "2026-03-15", 12500);
    const futureEntry = makeEntry("e3", "2026-03-25", 13000);

    renderView({ entries: [priorEntry, midEntry, futureEntry] });

    const user = userEvent.setup();
    // Change date to 2026-03-12 (between e1 and e2) and enter mileage below e1
    await user.clear(screen.getByLabelText(/Date/i));
    await user.type(screen.getByLabelText(/Date/i), "2026-03-12");
    await user.type(screen.getByLabelText(/Odometer/i), "11900");

    expect(screen.getByText(/Must be at least 12,000 mi/i)).toBeTruthy();
  });
});
