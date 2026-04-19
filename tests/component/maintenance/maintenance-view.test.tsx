import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MaintenanceView } from "@/components/maintenance/maintenance-view";
import { server } from "@/tests/component/msw/server";
import type { Car, MaintenanceScheduleItem } from "@/lib/db/schema";

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

const item: MaintenanceScheduleItem = {
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

function renderView(overrides?: Partial<React.ComponentProps<typeof MaintenanceView>>) {
  return render(
    <MaintenanceView
      cars={[car]}
      selectedCarId={car.id}
      selectedCar={car}
      items={[item]}
      {...overrides}
    />
  );
}

describe("MaintenanceView mutations", () => {
  beforeEach(() => {
    routerSpies.refresh.mockReset();
    routerSpies.replace.mockReset();
    toastSpies.success.mockReset();
    toastSpies.error.mockReset();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it("creates a maintenance item and refreshes the route", async () => {
    let capturedPayload: Record<string, unknown> | null = null;

    server.use(
      http.post("/api/maintenance", async ({ request }) => {
        capturedPayload = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ data: { id: "maintenance-2" } }, { status: 201 });
      })
    );

    const user = userEvent.setup();
    renderView({ items: [] });

    await user.click(screen.getAllByRole("button", { name: /Add Maintenance Item|Add Item|Add/i })[0]);
    await user.type(screen.getByLabelText(/^Name \*/i), "Brake Flush");
    await user.type(screen.getByLabelText(/Interval \(miles\)/i), "30000");
    await user.type(screen.getByLabelText(/Estimated Cost/i), "140");
    await user.click(screen.getByRole("button", { name: /Add Item/i }));

    await waitFor(() => {
      expect(routerSpies.refresh).toHaveBeenCalledTimes(1);
    });

    expect(capturedPayload).toEqual({
      car_id: "car-1",
      name: "Brake Flush",
      description: null,
      interval_miles: 30000,
      interval_months: null,
      last_done_mileage: null,
      last_done_date: null,
      estimated_cost: 140,
      notes: null,
    });
    expect(toastSpies.success).toHaveBeenCalledWith("Maintenance item added.");
  });

  it("updates and deletes an item through the route APIs", async () => {
    const capturedRequests: Array<{ method: string; body?: Record<string, unknown> }> = [];

    server.use(
      http.patch("/api/maintenance/:id", async ({ request }) => {
        capturedRequests.push({
          method: "PATCH",
          body: (await request.json()) as Record<string, unknown>,
        });
        return HttpResponse.json({ data: { id: "maintenance-1" } });
      }),
      http.delete("/api/maintenance/:id", async () => {
        capturedRequests.push({ method: "DELETE" });
        return new HttpResponse(null, { status: 204 });
      })
    );

    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByRole("button", { name: /Edit/i }));
    const intervalInput = screen.getByLabelText(/Interval \(miles\)/i);
    await user.clear(intervalInput);
    await user.type(intervalInput, "6000");
    const lastDoneMileageInput = screen.getByLabelText(/Last Done Mileage/i);
    await user.clear(lastDoneMileageInput);
    await user.type(lastDoneMileageInput, "12340");
    const lastDoneDateInput = screen.getByLabelText(/Last Done Date/i);
    await user.clear(lastDoneDateInput);
    await user.type(lastDoneDateInput, "2026-03-18");
    await user.click(screen.getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      expect(routerSpies.refresh).toHaveBeenCalledTimes(1);
    });

    expect(capturedRequests[0]).toEqual({
      method: "PATCH",
      body: {
        interval_miles: 6000,
        last_done_mileage: 12340,
        last_done_date: "2026-03-18",
      },
    });

    await user.click(screen.getByRole("button", { name: /Delete/i }));
    await user.click(screen.getByRole("button", { name: /Delete Item/i }));

    await waitFor(() => {
      expect(routerSpies.refresh).toHaveBeenCalledTimes(2);
    });

    expect(capturedRequests[1]).toEqual({ method: "DELETE" });
    expect(toastSpies.success).toHaveBeenCalledWith("Maintenance item deleted.");
  });
});
