import type { Car } from "@/lib/db/schema";

export interface CarExpenseBreakdownItem {
  key: "fuel" | "maintenance" | "improvements" | "repairs";
  label: string;
  value: number;
}

export function getCarTotalSpent(car: Car): number {
  return (
    car.total_fuel_spent +
    car.total_maintenance_spent +
    car.total_improvements_spent +
    car.total_repairs_spent
  );
}

export function getCarCostPerMile(car: Car): number {
  if (car.current_mileage <= 0) {
    return 0;
  }

  return Math.round((getCarTotalSpent(car) / car.current_mileage) * 100) / 100;
}

export function getCarExpenseBreakdown(car: Car): CarExpenseBreakdownItem[] {
  return [
    {
      key: "fuel",
      label: "Fuel",
      value: car.total_fuel_spent,
    },
    {
      key: "maintenance",
      label: "Maintenance",
      value: car.total_maintenance_spent,
    },
    {
      key: "improvements",
      label: "Improvements",
      value: car.total_improvements_spent,
    },
    {
      key: "repairs",
      label: "Repairs",
      value: car.total_repairs_spent,
    },
  ];
}
