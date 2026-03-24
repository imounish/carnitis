import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { TodosView } from "@/components/todos/todos-view";
import { server } from "@/tests/component/msw/server";
import type { Car, TodoItem } from "@/lib/db/schema";

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

const secondCar: Car = {
  ...car,
  id: "car-2",
  name: "Weekend Car",
};

const item: TodoItem = {
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
  overrides?: Partial<React.ComponentProps<typeof TodosView>>
) {
  return render(
    <TodosView
      cars={[car, secondCar]}
      selectedCarId={car.id}
      items={[item]}
      {...overrides}
    />
  );
}

describe("TodosView mutations", () => {
  beforeEach(() => {
    routerSpies.refresh.mockReset();
    routerSpies.replace.mockReset();
    toastSpies.success.mockReset();
    toastSpies.error.mockReset();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it("creates a task and refreshes the route", async () => {
    let capturedPayload: Record<string, unknown> | null = null;

    server.use(
      http.post("/api/todos", async ({ request }) => {
        capturedPayload = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ data: { id: "todo-2" } }, { status: 201 });
      })
    );

    const user = userEvent.setup();
    renderView({ items: [] });

    await user.click(screen.getAllByRole("button", { name: /Add Task|Add/i })[0]);
    await user.type(screen.getByLabelText(/^Title \*/i), "Brake flush");
    await user.type(screen.getByLabelText(/Description/i), "Before road trip");
    await user.type(screen.getByLabelText(/Est. Cost/i), "140");
    await user.click(screen.getByRole("button", { name: /Add Task/i }));

    await waitFor(() => {
      expect(routerSpies.refresh).toHaveBeenCalledTimes(1);
    });

    expect(capturedPayload).toEqual({
      car_id: "car-1",
      title: "Brake flush",
      description: "Before road trip",
      priority: "medium",
      status: "pending",
      category: null,
      estimated_cost: 140,
      due_date: null,
    });
    expect(toastSpies.success).toHaveBeenCalledWith("Task added.");
  });

  it("updates, toggles, deletes, and deep-links a task", async () => {
    const capturedRequests: Array<{
      method: string;
      body?: Record<string, unknown>;
    }> = [];

    server.use(
      http.patch("/api/todos/:id", async ({ request }) => {
        capturedRequests.push({
          method: "PATCH",
          body: (await request.json()) as Record<string, unknown>,
        });
        return HttpResponse.json({ data: { id: "todo-1" } });
      }),
      http.delete("/api/todos/:id", async () => {
        capturedRequests.push({ method: "DELETE" });
        return new HttpResponse(null, { status: 204 });
      })
    );

    const user = userEvent.setup();
    renderView();

    const logEntryLink = screen.getByRole("link", { name: /Log Entry/i });
    expect(logEntryLink.getAttribute("href")).toBe("/entries?car=car-1&todo=todo-1");

    await user.click(
      screen.getByRole("checkbox", {
        name: /Mark "Check cabin air filter" as complete/i,
      })
    );

    await waitFor(() => {
      expect(routerSpies.refresh).toHaveBeenCalledTimes(1);
    });

    expect(capturedRequests[0]).toEqual({
      method: "PATCH",
      body: {
        status: "completed",
      },
    });

    await user.click(screen.getByRole("button", { name: /Edit/i }));
    const titleInput = screen.getByLabelText(/^Title \*/i);
    await user.clear(titleInput);
    await user.type(titleInput, "Replace cabin air filter");
    await user.click(screen.getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      expect(routerSpies.refresh).toHaveBeenCalledTimes(2);
    });

    expect(capturedRequests[1]).toEqual({
      method: "PATCH",
      body: {
        title: "Replace cabin air filter",
      },
    });

    await user.click(screen.getByRole("button", { name: /Delete/i }));
    await user.click(screen.getByRole("button", { name: /Delete Task/i }));

    await waitFor(() => {
      expect(routerSpies.refresh).toHaveBeenCalledTimes(3);
    });

    expect(capturedRequests[2]).toEqual({ method: "DELETE" });
    expect(toastSpies.success).toHaveBeenCalledWith("Task deleted.");
  });

  it("syncs the selected car into the route URL", async () => {
    const user = userEvent.setup();
    renderView({ selectedCarId: "all" });

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByText("Weekend Car"));

    expect(routerSpies.replace).toHaveBeenCalledWith("/todos?car=car-2", {
      scroll: false,
    });
  });

  it("blocks empty edit submissions before hitting the API", async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByRole("button", { name: /Edit/i }));
    await user.click(screen.getByRole("button", { name: /Save Changes/i }));

    expect(toastSpies.error).toHaveBeenCalledWith("Make a change before saving.");
    expect(routerSpies.refresh).not.toHaveBeenCalled();
  });
});
