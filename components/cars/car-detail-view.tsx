import Link from "next/link";
import type { Car } from "@/lib/db/schema";
import {
  getCarCostPerMile,
  getCarExpenseBreakdown,
  getCarTotalSpent,
} from "@/lib/db/cars";
import { formatCurrency, formatMileage } from "@/lib/format";
import { StatCard } from "@/components/stat-card";
import { ExpenseDonutChart } from "@/components/dashboard/expense-donut-chart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CarDetailActions } from "@/components/cars/car-detail-actions";
import {
  ArrowLeft,
  DollarSign,
  Gauge,
  Plus,
  TrendingUp,
  Wrench,
} from "lucide-react";

export function CarDetailView({ car }: { car: Car }) {
  const totalSpent = getCarTotalSpent(car);
  const costPerMile = getCarCostPerMile(car);
  const expenseBreakdown = getCarExpenseBreakdown(car);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-4 md:px-6 md:py-6 lg:py-8">
      <div className="mb-5 md:mb-6">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="mb-3 h-9 px-2 text-xs text-muted-foreground md:mb-4"
        >
          <Link href="/cars">
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Back
          </Link>
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight text-foreground md:text-2xl lg:text-3xl">
              {car.name}
            </h1>
            <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground md:text-sm">
              <span>
                {car.year} {car.make} {car.model}
              </span>
              {car.color ? (
                <>
                  <span>{"·"}</span>
                  <span>{car.color}</span>
                </>
              ) : null}
              {car.license_plate ? (
                <>
                  <span>{"·"}</span>
                  <span className="font-mono">{car.license_plate}</span>
                </>
              ) : null}
            </p>
            {car.vin ? (
              <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/50 md:text-xs">
                VIN: {car.vin}
              </p>
            ) : null}
          </div>

          <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
            <Button asChild size="sm" className="h-10 flex-1 shrink-0 sm:flex-none">
              <Link href={`/entries?car=${car.id}`}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                <span className="hidden sm:inline">Log Entry</span>
                <span className="sm:hidden">Log</span>
              </Link>
            </Button>
            <CarDetailActions carId={car.id} />
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:mb-6 md:gap-4 lg:grid-cols-4">
        <StatCard
          label="Mileage"
          value={formatMileage(car.current_mileage)}
          icon={Gauge}
          subtitle={`as of ${car.mileage_as_of_date}`}
          compact
        />
        <StatCard
          label="Total Spent"
          value={formatCurrency(totalSpent)}
          icon={DollarSign}
          subtitle={`${formatCurrency(costPerMile)}/mi`}
          compact
        />
        <StatCard
          label="Fuel Type"
          value={car.fuel_type ? car.fuel_type.replaceAll("_", " ") : "--"}
          icon={TrendingUp}
          subtitle={
            car.fuel_tank_capacity != null
              ? `${car.fuel_tank_capacity} gal tank`
              : "Tank not set"
          }
          compact
        />
        <StatCard
          label="Primary Service"
          value={formatCurrency(car.total_maintenance_spent)}
          icon={Wrench}
          subtitle="Tracked from car totals"
          compact
        />
      </div>

      <div className="mb-4 grid gap-4 md:mb-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <section className="rounded-xl border border-border bg-card p-4 md:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-card-foreground md:text-base">
                Expense Breakdown
              </h2>
              <p className="mt-1 text-xs text-muted-foreground md:text-sm">
                This view is now backed by your real car record in Supabase.
              </p>
            </div>
            <Badge variant="secondary" className="shrink-0">
              Total: {formatCurrency(totalSpent)}
            </Badge>
          </div>

          <ExpenseDonutChart
            fuel={car.total_fuel_spent}
            maintenance={car.total_maintenance_spent}
            improvements={car.total_improvements_spent}
            repairs={car.total_repairs_spent}
          />
        </section>

        <section className="rounded-xl border border-border bg-card p-4 md:p-5">
          <h2 className="text-sm font-semibold text-card-foreground md:text-base">
            Car Record
          </h2>
          <dl className="mt-4 space-y-3">
            {expenseBreakdown.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2.5"
              >
                <dt className="text-sm text-muted-foreground">{item.label}</dt>
                <dd className="text-sm font-semibold text-card-foreground">
                  {formatCurrency(item.value)}
                </dd>
              </div>
            ))}
            <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border px-3 py-2.5">
              <dt className="text-sm text-muted-foreground">Notes</dt>
              <dd className="max-w-[65%] text-right text-sm text-card-foreground">
                {car.notes || "No notes yet"}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="rounded-xl border border-dashed border-border bg-card/70 p-4 md:p-5">
        <h2 className="text-sm font-semibold text-card-foreground md:text-base">
          Transitional Detail State
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Entries, maintenance schedules, tasks, and activity charts will move to
          Supabase in T007 through T009. This page currently shows the real
          car-owned data only.
        </p>
      </section>
    </div>
  );
}
