"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Car, MaintenanceScheduleItem } from "@/lib/db/schema";
import {
  buildCreateMaintenancePayload,
  buildUpdateMaintenancePayload,
  getEditableMaintenancePayloadFromItem,
  getMaintenanceFormValues,
} from "@/lib/db/maintenance-form";
import {
  formatCurrency,
  formatDate,
  formatMileage,
  getStatusLabel,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { MaintenanceForm } from "@/components/maintenance/maintenance-form";
import { Button } from "@/components/ui/button";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Gauge,
  Pencil,
  Plus,
  Settings,
  Trash2,
  Wrench,
} from "lucide-react";

interface MaintenanceViewProps {
  cars: Car[];
  selectedCarId: string;
  selectedCar: Car | null;
  items: MaintenanceScheduleItem[];
}

function getResponseErrorMessage(
  payload: unknown,
  fallbackMessage: string
): string {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    payload.error &&
    typeof payload.error === "object" &&
    "message" in payload.error &&
    typeof payload.error.message === "string"
  ) {
    return payload.error.message;
  }

  return fallbackMessage;
}

export function MaintenanceView({
  cars,
  selectedCarId,
  selectedCar,
  items,
}: MaintenanceViewProps) {
  const router = useRouter();
  const [carSelectValue, setCarSelectValue] = React.useState(selectedCarId);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editingItem, setEditingItem] =
    React.useState<MaintenanceScheduleItem | null>(null);
  const [deleteCandidate, setDeleteCandidate] =
    React.useState<MaintenanceScheduleItem | null>(null);
  const [savingCreate, setSavingCreate] = React.useState(false);
  const [savingEdit, setSavingEdit] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [isNavigating, startTransition] = React.useTransition();

  React.useEffect(() => {
    setCarSelectValue(selectedCarId);
  }, [selectedCarId]);

  function handleCarChange(nextCarId: string) {
    setCarSelectValue(nextCarId);
    startTransition(() => {
      router.replace(`/maintenance?car=${encodeURIComponent(nextCarId)}`, {
        scroll: false,
      });
    });
  }

  async function handleCreateItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCar) {
      toast.error("Select a car before adding maintenance.");
      return;
    }

    setSavingCreate(true);

    try {
      const response = await fetch("/api/maintenance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          buildCreateMaintenancePayload(new FormData(event.currentTarget), selectedCar.id)
        ),
      });

      const payload = (await response.json().catch(() => null)) as unknown;
      if (!response.ok) {
        throw new Error(
          getResponseErrorMessage(payload, "Failed to add maintenance item.")
        );
      }

      setCreateDialogOpen(false);
      toast.success("Maintenance item added.");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to add maintenance item."
      );
    } finally {
      setSavingCreate(false);
    }
  }

  async function handleEditItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingItem) {
      return;
    }

    const body = buildUpdateMaintenancePayload(
      new FormData(event.currentTarget),
      getEditableMaintenancePayloadFromItem(editingItem)
    );

    if (Object.keys(body).length === 0) {
      toast.error("Make a change before saving.");
      return;
    }

    setSavingEdit(true);

    try {
      const response = await fetch(`/api/maintenance/${editingItem.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const payload = (await response.json().catch(() => null)) as unknown;
      if (!response.ok) {
        throw new Error(
          getResponseErrorMessage(payload, "Failed to update maintenance item.")
        );
      }

      setEditingItem(null);
      toast.success("Maintenance item updated.");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update maintenance item."
      );
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeleteItem() {
    if (!deleteCandidate) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(`/api/maintenance/${deleteCandidate.id}`, {
        method: "DELETE",
      });

      const payload = (await response.json().catch(() => null)) as unknown;
      if (!response.ok) {
        throw new Error(
          getResponseErrorMessage(payload, "Failed to delete maintenance item.")
        );
      }

      setDeleteCandidate(null);
      toast.success("Maintenance item deleted.");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete maintenance item."
      );
    } finally {
      setDeleting(false);
    }
  }

  if (cars.length === 0 || !selectedCar) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center px-4 py-8 text-center">
        <div className="rounded-full bg-primary/10 p-3 text-primary">
          <Wrench className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-xl font-bold tracking-tight text-foreground">
          Add a car before tracking maintenance
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Maintenance schedules are tied to a specific car. Create your first
          car, then come back here to track service intervals.
        </p>
        <Button asChild className="mt-5">
          <Link href="/cars/new">Add Car</Link>
        </Button>
      </div>
    );
  }

  const overdueItems = items.filter((item) => item.status === "overdue");
  const dueSoonItems = items.filter((item) => item.status === "due_soon");

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

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
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
              <DialogDescription>
                Create a recurring maintenance reminder for the selected car.
              </DialogDescription>
            </DialogHeader>
            <MaintenanceForm
              mode="create"
              saving={savingCreate}
              onSubmit={handleCreateItem}
              onCancel={() => setCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4 space-y-1.5 md:mb-6">
        <Select
          value={carSelectValue}
          onValueChange={handleCarChange}
          disabled={isNavigating}
        >
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
        <p className="text-[11px] text-muted-foreground">
          Current mileage: {selectedCar.current_mileage.toLocaleString()} mi
        </p>
      </div>

      {(overdueItems.length > 0 || dueSoonItems.length > 0) && (
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
                  (sum, item) => sum + (item.estimated_cost ?? 0),
                  0
                )
              )}
            </span>
          </div>
        </div>
      )}

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
              carMileage={selectedCar.current_mileage}
              onEdit={() => setEditingItem(item)}
              onDelete={() => setDeleteCandidate(item)}
            />
          ))}
        </div>
      )}

      <Dialog
        open={editingItem !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingItem(null);
          }
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Maintenance Item</DialogTitle>
            <DialogDescription>
              Update the interval, last-service data, and cost details for this
              maintenance item.
            </DialogDescription>
          </DialogHeader>
          {editingItem ? (
            <MaintenanceForm
              key={editingItem.id}
              mode="edit"
              initialValues={getMaintenanceFormValues(editingItem)}
              saving={savingEdit}
              onSubmit={handleEditItem}
              onCancel={() => setEditingItem(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteCandidate !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteCandidate(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this maintenance item?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the schedule item. Once linked service
              entries are fully real, completed service history will continue to
              live in entries, but this schedule record itself will be gone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteItem}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete Item"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md safe-bottom-pad md:hidden">
        <Button
          type="button"
          onClick={() => setCreateDialogOpen(true)}
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
  onEdit,
  onDelete,
}: {
  item: MaintenanceScheduleItem;
  carMileage: number;
  onEdit: () => void;
  onDelete: () => void;
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
          className={cn(
            "shrink-0 text-[10px] md:text-[11px]",
            badgeStyleMap[item.status]
          )}
        >
          {getStatusLabel(item.status)}
        </Badge>
      </div>

      <div className="mt-3">
        <Progress
          value={progressPercent}
          className={cn("h-1.5", progressColorMap[item.status])}
        />
      </div>

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
              ? item.next_due_date
                ? formatDate(item.next_due_date)
                : "Not set"
              : milesUntilDue > 0
                ? `${formatMileage(milesUntilDue)} left`
                : `${formatMileage(Math.abs(milesUntilDue))} overdue`
          }
        />
        <DetailCell
          icon={CheckCircle2}
          label="Last Done"
          value={
            item.last_done_date
              ? formatDate(item.last_done_date)
              : item.last_done_mileage != null
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

      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm" className="h-9 flex-1 sm:flex-none">
          <Link
            href={`/entries?car=${encodeURIComponent(item.car_id)}&maintenance=${encodeURIComponent(item.id)}&mode=service`}
          >
            <Settings className="h-3.5 w-3.5" />
            Log Service
          </Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 flex-1 sm:flex-none"
          onClick={onEdit}
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 flex-1 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive sm:flex-none"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
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
