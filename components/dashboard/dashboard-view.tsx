"use client";

import * as React from "react";
import Link from "next/link";
import {
  getDashboardStats,
  getCars,
  getRecentEntries,
  getAllUpcomingMaintenance,
  getAllTodos,
} from "@/lib/db/api";
import type {
  Car,
  Entry,
  MaintenanceScheduleItem,
  TodoItem,
} from "@/lib/db/schema";
import { StatCard } from "@/components/stat-card";
import { CarCard } from "@/components/car-card";
import { RecentEntryRow } from "@/components/dashboard/recent-entry-row";
import { MaintenanceAlertRow } from "@/components/dashboard/maintenance-alert-row";
import { TodoAlertRow } from "@/components/dashboard/todo-alert-row";
import { ExpenseDonutChart } from "@/components/dashboard/expense-donut-chart";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import {
  Car as CarIcon,
  DollarSign,
  Wrench,
  ListTodo,
  Plus,
  ArrowRight,
  ChevronRight,
  Fuel,
} from "lucide-react";

interface DashboardData {
  stats: {
    totalCars: number;
    totalSpent: number;
    upcomingMaintenance: number;
    pendingTodos: number;
  };
  cars: Car[];
  recentEntries: (Entry & { car?: Car })[];
  maintenanceAlerts: (MaintenanceScheduleItem & { car?: Car })[];
  todos: (TodoItem & { car?: Car })[];
}

export function DashboardView() {
  const [data, setData] = React.useState<DashboardData | null>(null);

  React.useEffect(() => {
    async function load() {
      const [stats, cars, recentEntries, maintenanceAlerts, todos] =
        await Promise.all([
          getDashboardStats(),
          getCars(),
          getRecentEntries(8),
          getAllUpcomingMaintenance(),
          getAllTodos(),
        ]);
      setData({ stats, cars, recentEntries, maintenanceAlerts, todos });
    }
    load();
  }, []);

  if (!data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const { stats, cars, recentEntries, maintenanceAlerts, todos } = data;

  // Compute aggregate expense data for donut
  const totalFuel = cars.reduce((s, c) => s + c.total_fuel_spent, 0);
  const totalMaint = cars.reduce((s, c) => s + c.total_maintenance_spent, 0);
  const totalImprove = cars.reduce(
    (s, c) => s + c.total_improvements_spent,
    0
  );
  const totalRepair = cars.reduce((s, c) => s + c.total_repairs_spent, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 md:py-6 lg:px-6 lg:py-8">
      {/* Header - compact on mobile */}
      <div className="mb-4 flex items-center justify-between md:mb-8">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl lg:text-3xl">
            Dashboard
          </h1>
          <p className="mt-0.5 hidden text-sm text-muted-foreground sm:block">
            Overview of all your vehicles and recent activity.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline" className="hidden sm:flex">
            <Link href="/cars/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Car
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/entries">
              <Plus className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Log Entry</span>
              <span className="sm:hidden">Log</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats row - 2x2 on mobile, 4-col on desktop */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:mb-8 md:gap-4 lg:grid-cols-4">
        <StatCard
          label="Vehicles"
          value={String(stats.totalCars)}
          icon={CarIcon}
          subtitle="Tracked"
          compact
        />
        <StatCard
          label="Total Spent"
          value={formatCurrency(stats.totalSpent)}
          icon={DollarSign}
          subtitle="All time"
          compact
        />
        <StatCard
          label="Service Due"
          value={String(stats.upcomingMaintenance)}
          icon={Wrench}
          subtitle={
            stats.upcomingMaintenance > 0 ? "Needs attention" : "All clear"
          }
          trend={stats.upcomingMaintenance > 0 ? "down" : "up"}
          compact
        />
        <StatCard
          label="Open Tasks"
          value={String(stats.pendingTodos)}
          icon={ListTodo}
          subtitle="Pending"
          compact
        />
      </div>

      {/* Main grid - stacked on mobile, 3-col on desktop */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        {/* Left column: Cars + recent entries + donut chart */}
        <div className="flex flex-col gap-4 md:gap-6 lg:col-span-2">
          {/* Cars - horizontal scroll on mobile */}
          <section>
            <SectionHeader
              title="My Cars"
              href="/cars"
              actionLabel="View all"
            />
            {/* Mobile: horizontal scroll. Desktop: grid */}
            <div className="-mx-4 px-4 md:mx-0 md:px-0">
              <div className="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:pb-0">
                {cars.slice(0, 4).map((car) => (
                  <div key={car.id} className="w-[280px] shrink-0 md:w-auto">
                    <CarCard car={car} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Expense breakdown donut */}
          <section className="rounded-xl border border-border bg-card p-4 md:p-5">
            <h3 className="mb-3 text-sm font-semibold text-card-foreground">
              Expense Breakdown
            </h3>
            <ExpenseDonutChart
              fuel={totalFuel}
              maintenance={totalMaint}
              improvements={totalImprove}
              repairs={totalRepair}
            />
          </section>

          {/* Recent entries */}
          <section>
            <SectionHeader
              title="Recent Entries"
              href="/entries"
              actionLabel="View all"
            />
            <div className="divide-y divide-border rounded-xl border border-border bg-card">
              {recentEntries.length === 0 ? (
                <EmptyState
                  icon={Fuel}
                  message="No entries yet. Start by logging your first expense."
                />
              ) : (
                recentEntries
                  .slice(0, 6)
                  .map((entry) => (
                    <RecentEntryRow key={entry.id} entry={entry} />
                  ))
              )}
            </div>
          </section>
        </div>

        {/* Right column: maintenance + todos */}
        <div className="flex flex-col gap-4 md:gap-6">
          {/* Maintenance alerts */}
          <section>
            <SectionHeader
              title="Maintenance Alerts"
              href="/maintenance"
              actionLabel="View all"
            />
            <div className="flex flex-col gap-2">
              {maintenanceAlerts.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                  No upcoming maintenance.
                </div>
              ) : (
                maintenanceAlerts
                  .slice(0, 5)
                  .map((item) => (
                    <MaintenanceAlertRow key={item.id} item={item} />
                  ))
              )}
            </div>
          </section>

          {/* Todo alerts */}
          <section>
            <SectionHeader
              title="To-Do Items"
              href="/todos"
              actionLabel="View all"
            />
            <div className="flex flex-col gap-2">
              {todos.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                  No pending tasks.
                </div>
              ) : (
                todos
                  .slice(0, 5)
                  .map((todo) => (
                    <TodoAlertRow key={todo.id} todo={todo} />
                  ))
              )}
            </div>
          </section>

          {/* Quick action card - mobile friendly */}
          <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
            <h3 className="text-sm font-semibold text-foreground">
              Quick Actions
            </h3>
            <div className="mt-3 flex flex-col gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="justify-start"
              >
                <Link href="/entries">
                  <Fuel className="mr-2 h-4 w-4 text-chart-3" />
                  Log Fuel Stop
                  <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="justify-start"
              >
                <Link href="/entries">
                  <Wrench className="mr-2 h-4 w-4 text-chart-1" />
                  Log Maintenance
                  <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="justify-start"
              >
                <Link href="/cars/new">
                  <Plus className="mr-2 h-4 w-4 text-chart-2" />
                  Add New Car
                  <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  href,
  actionLabel,
}: {
  title: string;
  href: string;
  actionLabel: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-base font-semibold text-foreground md:text-lg">
        {title}
      </h2>
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="h-auto px-2 py-1 text-xs text-muted-foreground"
      >
        <Link href={href}>
          {actionLabel} <ArrowRight className="ml-1 h-3 w-3" />
        </Link>
      </Button>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  message,
}: {
  icon: React.ComponentType<{ className?: string }>;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <Icon className="mb-2 h-6 w-6 text-muted-foreground" />
      <p className="text-center text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
