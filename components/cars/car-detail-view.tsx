"use client";

import * as React from "react";
import Link from "next/link";
import {
  getCarById,
  getEntriesByCarId,
  getMaintenanceByCarId,
  getTodosByCarId,
  getCarStats,
} from "@/lib/db/api";
import type {
  Car,
  Entry,
  MaintenanceScheduleItem,
  TodoItem,
} from "@/lib/db/schema";
import {
  formatCurrency,
  formatMileage,
  formatDate,
  formatDateRelative,
  getEntryTypeLabel,
  getCategoryLabel,
  getStatusLabel,
} from "@/lib/format";
import { StatCard } from "@/components/stat-card";
import { ExpenseDonutChart } from "@/components/dashboard/expense-donut-chart";
import { RecentEntryRow } from "@/components/dashboard/recent-entry-row";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Plus,
  Fuel,
  DollarSign,
  Gauge,
  TrendingUp,
  Wrench,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface CarDetailData {
  car: Car;
  entries: Entry[];
  maintenance: MaintenanceScheduleItem[];
  todos: TodoItem[];
  stats: {
    totalSpent: number;
    avgMpg: number;
    estimatedRange: number | null;
    dueSoonCount: number;
    pendingTodos: number;
    monthlySpending: {
      month: string;
      fuel: number;
      maintenance: number;
      other: number;
    }[];
    fuelEntryCount: number;
    totalEntries: number;
    costPerMile: number;
  };
}

export function CarDetailView({ carId }: { carId: string }) {
  const [data, setData] = React.useState<CarDetailData | null>(null);
  const [activeSection, setActiveSection] = React.useState<
    "entries" | "maintenance" | "todos"
  >("entries");

  React.useEffect(() => {
    async function load() {
      const [car, entries, maintenance, todos, stats] = await Promise.all([
        getCarById(carId),
        getEntriesByCarId(carId),
        getMaintenanceByCarId(carId),
        getTodosByCarId(carId),
        getCarStats(carId),
      ]);
      if (car && stats) {
        setData({ car, entries, maintenance, todos, stats });
      }
    }
    load();
  }, [carId]);

  if (!data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const { car, entries, maintenance, todos, stats } = data;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-4 md:px-6 md:py-6 lg:py-8">
      {/* Back + header */}
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
              {car.color && (
                <>
                  <span>{"·"}</span>
                  <span>{car.color}</span>
                </>
              )}
              {car.license_plate && (
                <>
                  <span>{"·"}</span>
                  <span className="font-mono">{car.license_plate}</span>
                </>
              )}
            </p>
            {car.vin && (
              <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/50 md:text-xs">
                VIN: {car.vin}
              </p>
            )}
          </div>
          <Button asChild size="sm" className="h-10 shrink-0">
            <Link href={`/entries?car=${car.id}`}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              <span className="hidden sm:inline">Log Entry</span>
              <span className="sm:hidden">Log</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats - 2x2 on mobile, 5-col on desktop */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:mb-6 md:gap-4 lg:grid-cols-5">
        <StatCard
          label="Mileage"
          value={formatMileage(car.current_mileage)}
          icon={Gauge}
          compact
        />
        <StatCard
          label="Total Spent"
          value={formatCurrency(stats.totalSpent)}
          icon={DollarSign}
          subtitle={`${formatCurrency(stats.costPerMile)}/mi`}
          compact
        />
        <StatCard
          label="Avg. MPG"
          value={stats.avgMpg > 0 ? String(stats.avgMpg) : "--"}
          icon={TrendingUp}
          subtitle={
            stats.fuelEntryCount > 0
              ? `${stats.fuelEntryCount} fill-ups`
              : "No data"
          }
          compact
        />
        <StatCard
          label="Est. Range"
          value={
            stats.estimatedRange != null
              ? `${stats.estimatedRange} mi`
              : "--"
          }
          icon={MapPin}
          subtitle={
            stats.estimatedRange != null && stats.estimatedRange < 50
              ? "Refuel soon"
              : null
          }
          trend={
            stats.estimatedRange != null && stats.estimatedRange < 50
              ? "down"
              : undefined
          }
          compact
        />
        <StatCard
          label="Service Due"
          value={String(stats.dueSoonCount)}
          icon={Wrench}
          trend={stats.dueSoonCount > 0 ? "down" : "up"}
          subtitle={stats.dueSoonCount > 0 ? "Attention" : "All clear"}
          compact
        />
      </div>

      {/* Charts row */}
      <div className="mb-4 grid gap-4 md:mb-6 lg:grid-cols-2">
        {/* Monthly spending */}
        <div className="rounded-xl border border-border bg-card p-3 md:p-5">
          <h3 className="mb-3 text-xs font-semibold text-card-foreground md:text-sm">
            Monthly Spending
          </h3>
          <div className="h-44 md:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlySpending} barGap={2}>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v}`}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "0.5rem",
                    color: "var(--card-foreground)",
                    fontSize: "11px",
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend wrapperStyle={{ fontSize: "10px" }} />
                <Bar
                  dataKey="fuel"
                  name="Fuel"
                  fill="var(--chart-3)"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="maintenance"
                  name="Maint."
                  fill="var(--chart-1)"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="other"
                  name="Other"
                  fill="var(--chart-2)"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense donut */}
        <div className="rounded-xl border border-border bg-card p-3 md:p-5">
          <h3 className="mb-3 text-xs font-semibold text-card-foreground md:text-sm">
            Expense Breakdown
          </h3>
          <ExpenseDonutChart
            fuel={car.total_fuel_spent}
            maintenance={car.total_maintenance_spent}
            improvements={car.total_improvements_spent}
            repairs={car.total_repairs_spent}
          />
        </div>
      </div>

      {/* Tabs - pill style for mobile */}
      <div className="mb-3 flex gap-1.5 rounded-lg border border-border bg-muted/50 p-1">
        {[
          { key: "entries" as const, label: `Entries (${entries.length})` },
          {
            key: "maintenance" as const,
            label: `Service (${maintenance.length})`,
          },
          { key: "todos" as const, label: `Tasks (${todos.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key)}
            className={cn(
              "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors md:text-sm",
              activeSection === tab.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeSection === "entries" && (
        <div className="divide-y divide-border rounded-xl border border-border bg-card">
          {entries.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No entries yet for this car.
            </div>
          ) : (
            entries.map((entry) => (
              <RecentEntryRow key={entry.id} entry={entry} />
            ))
          )}
        </div>
      )}

      {activeSection === "maintenance" && (
        <div className="flex flex-col gap-2">
          {maintenance.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              No maintenance items. Add from the Maintenance page.
            </div>
          ) : (
            maintenance.map((item) => (
              <MaintenanceRow
                key={item.id}
                item={item}
                carMileage={car.current_mileage}
              />
            ))
          )}
        </div>
      )}

      {activeSection === "todos" && (
        <div className="flex flex-col gap-2">
          {todos.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              No tasks for this car.
            </div>
          ) : (
            todos.map((todo) => <TodoRow key={todo.id} todo={todo} />)
          )}
        </div>
      )}
    </div>
  );
}

function MaintenanceRow({
  item,
  carMileage,
}: {
  item: MaintenanceScheduleItem;
  carMileage: number;
}) {
  const milesUntilDue =
    item.next_due_mileage != null ? item.next_due_mileage - carMileage : null;

  const statusStyles: Record<string, string> = {
    overdue: "bg-destructive/15 text-destructive",
    due_soon: "bg-warning/15 text-warning-foreground",
    upcoming: "bg-muted text-muted-foreground",
    completed: "bg-success/15 text-success",
  };

  const StatusIcon =
    item.status === "overdue"
      ? AlertTriangle
      : item.status === "completed"
        ? CheckCircle2
        : Clock;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 md:gap-4 md:px-4 md:py-3">
      <StatusIcon
        className={cn(
          "h-4 w-4 shrink-0",
          item.status === "overdue"
            ? "text-destructive"
            : item.status === "due_soon"
              ? "text-warning"
              : item.status === "completed"
                ? "text-success"
                : "text-muted-foreground"
        )}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium text-card-foreground">
          {item.name}
        </span>
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0 text-[11px] text-muted-foreground">
          <span>Every {formatMileage(item.interval_miles)}</span>
          {item.last_done_date && (
            <>
              <span>{"·"}</span>
              <span>Last: {formatDate(item.last_done_date)}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <Badge
          variant="secondary"
          className={cn("text-[10px]", statusStyles[item.status])}
        >
          {getStatusLabel(item.status)}
        </Badge>
        {milesUntilDue != null && (
          <span className="text-[10px] text-muted-foreground">
            {milesUntilDue > 0
              ? `${formatMileage(milesUntilDue)} left`
              : `${formatMileage(Math.abs(milesUntilDue))} over`}
          </span>
        )}
      </div>
    </div>
  );
}

function TodoRow({ todo }: { todo: TodoItem }) {
  const priorityDotColor: Record<string, string> = {
    low: "bg-muted-foreground",
    medium: "bg-chart-1",
    high: "bg-warning",
    urgent: "bg-destructive",
  };

  const statusBadge: Record<string, string> = {
    pending: "bg-muted text-muted-foreground",
    in_progress: "bg-chart-1/15 text-chart-1",
    completed: "bg-success/15 text-success",
    cancelled: "bg-muted text-muted-foreground line-through",
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 md:px-4 md:py-3">
      <div
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          priorityDotColor[todo.priority]
        )}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <span
          className={cn(
            "text-sm font-medium text-card-foreground",
            todo.status === "cancelled" && "line-through opacity-50"
          )}
        >
          {todo.title}
        </span>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {todo.category && <span>{getCategoryLabel(todo.category)}</span>}
          {todo.estimated_cost != null && (
            <>
              <span>{"·"}</span>
              <span>~{formatCurrency(todo.estimated_cost)}</span>
            </>
          )}
          {todo.due_date && (
            <>
              <span>{"·"}</span>
              <span>Due {formatDate(todo.due_date)}</span>
            </>
          )}
        </div>
      </div>
      <Badge
        variant="secondary"
        className={cn("text-[10px]", statusBadge[todo.status])}
      >
        {getStatusLabel(todo.status)}
      </Badge>
    </div>
  );
}
