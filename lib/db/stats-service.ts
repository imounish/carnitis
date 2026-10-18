import type { DataAccess } from "@/lib/db/contracts";

export async function getCarStatsFromDataAccess(
  dataAccess: DataAccess,
  carId: string
) {
  const car = await dataAccess.cars.getById(carId);
  if (!car) {
    return null;
  }

  const [entries, maintenanceItems, todos] = await Promise.all([
    dataAccess.entries.listByCarId(carId),
    dataAccess.maintenance.listByCarId(carId),
    dataAccess.todos.listByCarId(carId),
  ]);

  const fuelEntries = entries.filter((entry) => entry.entry_type === "fuel");
  const recentFuel = fuelEntries
    .filter((entry) => entry.was_full_tank)
    .sort((left, right) => right.mileage - left.mileage)
    .slice(0, 5);

  let avgMpg = 0;
  if (recentFuel.length >= 2) {
    const totalMiles =
      recentFuel[0].mileage - recentFuel[recentFuel.length - 1].mileage;
    const totalGallons = recentFuel
      .slice(0, -1)
      .reduce((sum, entry) => sum + (entry.fuel_gallons ?? 0), 0);

    avgMpg = totalGallons > 0 ? totalMiles / totalGallons : 0;
  }

  const totalSpent =
    car.total_fuel_spent +
    car.total_maintenance_spent +
    car.total_improvements_spent +
    car.total_repairs_spent;

  const dueSoonCount = maintenanceItems.filter(
    (item) => item.status === "due_soon" || item.status === "overdue"
  ).length;

  const pendingTodos = todos.filter(
    (item) => item.status === "pending" || item.status === "in_progress"
  ).length;

  const mostRecentFuelEntryWithLevelSignal = [...fuelEntries]
    .sort(
      (left, right) =>
        right.date.localeCompare(left.date) || right.mileage - left.mileage
    )
    .find(
      (entry) => entry.was_full_tank || entry.fuel_level_before != null
    );
  const milesSinceLastFill = mostRecentFuelEntryWithLevelSignal
    ? car.current_mileage - mostRecentFuelEntryWithLevelSignal.mileage
    : 0;

  let gallonsAfterLastFill: number | null = null;
  if (mostRecentFuelEntryWithLevelSignal && car.fuel_tank_capacity) {
    if (mostRecentFuelEntryWithLevelSignal.was_full_tank) {
      gallonsAfterLastFill = car.fuel_tank_capacity;
    } else if (mostRecentFuelEntryWithLevelSignal.fuel_level_before != null) {
      gallonsAfterLastFill = Math.min(
        car.fuel_tank_capacity,
        (mostRecentFuelEntryWithLevelSignal.fuel_level_before / 100) *
          car.fuel_tank_capacity +
          (mostRecentFuelEntryWithLevelSignal.fuel_gallons ?? 0)
      );
    }
  }

  const estimatedRange =
    avgMpg > 0 && gallonsAfterLastFill != null
      ? Math.max(
          0,
          Math.round(gallonsAfterLastFill * avgMpg - milesSinceLastFill)
        )
      : null;

  const now = new Date();
  const monthlySpending = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthEntries = entries.filter((entry) => entry.date.startsWith(monthKey));
    const fuel = monthEntries
      .filter((entry) => entry.expense_category === "fuel")
      .reduce((sum, entry) => sum + (entry.expense_amount ?? 0), 0);
    const maintenance = monthEntries
      .filter(
        (entry) =>
          entry.expense_category === "regular_maintenance" ||
          entry.expense_category === "preventive_maintenance"
      )
      .reduce((sum, entry) => sum + (entry.expense_amount ?? 0), 0);
    const other = monthEntries
      .filter(
        (entry) =>
          entry.expense_category === "improvements" ||
          entry.expense_category === "repairs"
      )
      .reduce((sum, entry) => sum + (entry.expense_amount ?? 0), 0);

    return {
      month: date.toLocaleString("default", { month: "short" }),
      fuel,
      maintenance,
      other,
    };
  }).reverse();

  return {
    totalSpent,
    avgMpg: Math.round(avgMpg * 10) / 10,
    estimatedRange,
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

export async function getDashboardStatsFromDataAccess(dataAccess: DataAccess) {
  const [cars, upcomingMaintenance, todos] = await Promise.all([
    dataAccess.cars.list(),
    dataAccess.maintenance.listUpcoming(),
    dataAccess.todos.listAll(),
  ]);

  const totalCars = cars.length;
  const totalSpent = cars.reduce(
    (sum, car) =>
      sum +
      car.total_fuel_spent +
      car.total_maintenance_spent +
      car.total_improvements_spent +
      car.total_repairs_spent,
    0
  );

  return {
    totalCars,
    totalSpent,
    upcomingMaintenance: upcomingMaintenance.filter(
      (item) => item.status === "due_soon" || item.status === "overdue"
    ).length,
    pendingTodos: todos.filter(
      (item) => item.status === "pending" || item.status === "in_progress"
    ).length,
  };
}
