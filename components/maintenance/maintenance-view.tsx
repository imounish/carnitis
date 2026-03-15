"use client";

import * as React from "react";
import {
  getCars,
  getMaintenanceByCarId,
  createMaintenanceItem,
} from "@/lib/db/api";
import type { Car, MaintenanceScheduleItem } from "@/lib/db/schema";
import {
  formatMileage,
  formatDate,
  formatCurrency,
  getStatusLabel,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Wrench,
  Gauge,
  DollarSign,
} from "lucide-react";

export function MaintenanceView() {
  const [cars, setCars] = React.useState<Car[]>([]);
  const [selectedCarId, setSelectedCarId] = React.useState("");
  const [items, setItems] = React.useState<MaintenanceScheduleItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  React.useEffect(() => {
    getCars().then((c) => {
      setCars(c);
      if (c.length > 0) setSelectedCarId(c[0].id);
      setLoading(false);
    });
  }, []);

  React.useEffect(() => {
    if (selectedCarId) {
      getMaintenanceByCarId(selectedCarId).then(setItems);
    }
  }, [selectedCarId]);

  const selectedCar = cars.find((c) => c.id === selectedCarId);

  async function handleAddItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const car = selectedCar;
      const intervalMiles = Number(fd.get("interval_miles"));
      const intervalMonths = fd.get("interval_months")
        ? Number(fd.get("interval_months"))
        : null;

      const newItem = await createMaintenanceItem({
        car_id: selectedCarId,
        name: fd.get("name") as string,
        description: (fd.get("description") as string) || null,
        interval_miles: intervalMiles,
        interval_months: intervalMonths,
        last_done_mileage: null,
        last_done_date: null,
        next_due_mileage: car
          ? car.current_mileage + intervalMiles
          : intervalMiles,
        next_due_date: intervalMonths
          ? (() => {
              const d = new Date();
              d.setMonth(d.getMonth() + intervalMonths);
              return d.toISOString().split("T")[0];
            })()
          : null,
        status: "upcoming",
        estimated_cost: fd.get("estimated_cost")
          ? Number(fd.get("estimated_cost"))
          : null,
        notes: (fd.get("notes") as string) || null,
      });

      setItems((prev) => [...prev, newItem]);
      toast.success("Maintenance item added!");
      setDialogOpen(false);
    } catch {
      toast.error("Failed to add item.");
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const overdueItems = items.filter((i) => i.status === "overdue");
  const dueSoonItems = items.filter((i) => i.status === "due_soon");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-4 pb-24 md:px-6 md:py-6 md:pb-8 lg:py-8">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3 md:mb-6 md:items-end">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl lg:text-3xl">
            Maintenance
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">
            Track service intervals and stay on schedule.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="hidden h-10 tap-target md:inline-flex">
              <Plus className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Add Item</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Maintenance Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="add_name">Name *</Label>
                <Input
                  id="add_name"
                  name="name"
                  placeholder="Oil Change, Tire Rotation, etc."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add_desc">Description</Label>
                <Input
                  id="add_desc"
                  name="description"
                  placeholder="Full synthetic 0W-20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="add_miles">Interval (miles) *</Label>
                  <Input
                    id="add_miles"
                    name="interval_miles"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    placeholder="7500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add_months">Interval (months)</Label>
                  <Input
                    id="add_months"
                    name="interval_months"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    placeholder="6"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add_cost">Estimated Cost ($)</Label>
                <Input
                  id="add_cost"
                  name="estimated_cost"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={0}
                  placeholder="85.00"
                />
              </div>
              <Button type="submit" className="w-full">
                Add Item
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Car selector */}
      <div className="mb-4 md:mb-6">
        <Select value={selectedCarId} onValueChange={setSelectedCarId}>
          <SelectTrigger className="h-10 w-full max-w-md text-sm">
            <SelectValue placeholder="Select a car" />
          </SelectTrigger>
          <SelectContent>
            {cars.map((car) => (
              <SelectItem key={car.id} value={car.id}>
                {car.name} - {car.year} {car.make} {car.model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reminder summary cards - compact on mobile */}
      {selectedCar && (overdueItems.length > 0 || dueSoonItems.length > 0) && (
        <div className="mb-4 grid grid-cols-2 gap-3 md:mb-6 md:grid-cols-3">
          <div
            className={cn(
              "rounded-xl border p-3 md:p-4",
              overdueItems.length > 0
                ? "border-destructive/30 bg-destructive/5"
                : "border-border bg-card"
            )}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold md:text-sm">
              <AlertTriangle
                className={cn(
                  "h-3.5 w-3.5",
                  overdueItems.length > 0
                    ? "text-destructive"
                    : "text-muted-foreground"
                )}
              />
              <span
                className={
                  overdueItems.length > 0
                    ? "text-destructive"
                    : "text-card-foreground"
                }
              >
                Overdue
              </span>
            </div>
            <span className="mt-1 block text-lg font-bold text-card-foreground md:text-xl">
              {overdueItems.length}
            </span>
          </div>
          <div
            className={cn(
              "rounded-xl border p-3 md:p-4",
              dueSoonItems.length > 0
                ? "border-warning/30 bg-warning/5"
                : "border-border bg-card"
            )}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold md:text-sm">
              <Clock
                className={cn(
                  "h-3.5 w-3.5",
                  dueSoonItems.length > 0
                    ? "text-warning"
                    : "text-muted-foreground"
                )}
              />
              <span className="text-card-foreground">Due Soon</span>
            </div>
            <span className="mt-1 block text-lg font-bold text-card-foreground md:text-xl">
              {dueSoonItems.length}
            </span>
          </div>
          <div className="col-span-2 rounded-xl border border-border bg-card p-3 md:col-span-1 md:p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-card-foreground md:text-sm">
              <DollarSign className="h-3.5 w-3.5 text-primary" />
              Est. Upcoming
            </div>
            <span className="mt-1 block text-lg font-bold text-card-foreground md:text-xl">
              {formatCurrency(
                [...overdueItems, ...dueSoonItems].reduce(
                  (s, i) => s + (i.estimated_cost ?? 0),
                  0
                )
              )}
            </span>
          </div>
        </div>
      )}

      {/* Items list */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
          <Wrench className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No maintenance items. Add one to start tracking.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 md:gap-3">
          {items.map((item) => (
            <MaintenanceCard
              key={item.id}
              item={item}
              carMileage={selectedCar?.current_mileage ?? 0}
            />
          ))}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md safe-bottom-pad md:hidden">
        <Button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="h-11 w-full"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add Maintenance Item
        </Button>
      </div>
    </div>
  );
}

function MaintenanceCard({
  item,
  carMileage,
}: {
  item: MaintenanceScheduleItem;
  carMileage: number;
}) {
  const milesUntilDue =
    item.next_due_mileage != null ? item.next_due_mileage - carMileage : null;
  const totalInterval = item.interval_miles;
  const milesSinceLast =
    item.last_done_mileage != null
      ? carMileage - item.last_done_mileage
      : item.next_due_mileage != null
        ? totalInterval - (item.next_due_mileage - carMileage)
        : 0;
  const progressPercent = Math.min(
    100,
    Math.max(0, (milesSinceLast / totalInterval) * 100)
  );

  const statusIcon =
    item.status === "overdue"
      ? AlertTriangle
      : item.status === "completed"
        ? CheckCircle2
        : Clock;
  const StatusIcon = statusIcon;

  const statusColorMap: Record<string, string> = {
    overdue: "text-destructive",
    due_soon: "text-warning",
    upcoming: "text-primary",
    completed: "text-success",
  };

  const badgeStyleMap: Record<string, string> = {
    overdue: "bg-destructive/15 text-destructive border-destructive/20",
    due_soon: "bg-warning/15 text-warning-foreground border-warning/20",
    upcoming: "bg-primary/10 text-primary border-primary/20",
    completed: "bg-success/15 text-success border-success/20",
  };

  const progressColorMap: Record<string, string> = {
    overdue: "[&>div]:bg-destructive",
    due_soon: "[&>div]:bg-warning",
    upcoming: "[&>div]:bg-primary",
    completed: "[&>div]:bg-success",
  };

  return (
    <div className="rounded-xl border border-border bg-card p-3 transition-all hover:border-primary/20 hover:shadow-sm md:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 md:gap-3">
          <StatusIcon
            className={cn(
              "mt-0.5 h-4 w-4 shrink-0 md:h-5 md:w-5",
              statusColorMap[item.status]
            )}
          />
          <div>
            <h3 className="text-sm font-semibold text-card-foreground">
              {item.name}
            </h3>
            {item.description && (
              <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1 md:text-xs">
                {item.description}
              </p>
            )}
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn("shrink-0 text-[10px] md:text-[11px]", badgeStyleMap[item.status])}
        >
          {getStatusLabel(item.status)}
        </Badge>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <Progress
          value={progressPercent}
          className={cn("h-1.5", progressColorMap[item.status])}
        />
      </div>

      {/* Structured details for consistent mobile layout */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground md:mt-3.5 md:gap-3 md:text-xs">
        <DetailCell
          icon={Gauge}
          label="Interval"
          value={`Every ${formatMileage(item.interval_miles)}${item.interval_months ? ` / ${item.interval_months}mo` : ""}`}
        />
        <DetailCell
          icon={Clock}
          label="Due"
          value={
            milesUntilDue == null
              ? "Not set"
              : milesUntilDue > 0
                ? `${formatMileage(milesUntilDue)} left`
                : `${formatMileage(Math.abs(milesUntilDue))} overdue`
          }
        />
        <DetailCell
          icon={CheckCircle2}
          label="Last Done"
          value={
            item.last_done_mileage != null
              ? formatMileage(item.last_done_mileage)
              : "Not recorded"
          }
        />
        <DetailCell
          icon={DollarSign}
          label="Est. Cost"
          value={
            item.estimated_cost != null
              ? `~${formatCurrency(item.estimated_cost)}`
              : "Not set"
          }
        />
      </div>
    </div>
  );
}

function DetailCell({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-muted/40 px-2.5 py-2">
      <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/80 md:text-[11px]">
        <Icon className="h-3 w-3" />
        <span>{label}</span>
      </div>
      <p className="mt-0.5 truncate text-[11px] font-medium text-card-foreground md:text-xs">
        {value}
      </p>
    </div>
  );
}
