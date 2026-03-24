"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  Fuel,
  Plus,
  Save,
  Settings,
  Wrench,
} from "lucide-react";
import type {
  Car,
  Entry,
  EntryType,
  MaintenanceScheduleItem,
  TodoItem,
} from "@/lib/db/schema";
import { buildCreateEntryPayloadFromFormData } from "@/lib/db/entry-payload";
import { RecentEntryRow } from "@/components/dashboard/recent-entry-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getLocalDateInputValue } from "@/lib/format";
import { cn } from "@/lib/utils";

const entryTabs = [
  {
    value: "fuel" as EntryType,
    label: "Fuel",
    shortLabel: "Fuel",
    icon: Fuel,
    color: "text-chart-3",
    activeBg: "bg-chart-3/10 border-chart-3/30",
  },
  {
    value: "maintenance_expense" as EntryType,
    label: "Expense",
    shortLabel: "Expense",
    icon: Wrench,
    color: "text-chart-1",
    activeBg: "bg-chart-1/10 border-chart-1/30",
  },
  {
    value: "maintenance_done" as EntryType,
    label: "Service",
    shortLabel: "Service",
    icon: Settings,
    color: "text-chart-2",
    activeBg: "bg-chart-2/10 border-chart-2/30",
  },
];

const NONE_OPTION = "_none";

interface EntryLogViewProps {
  cars: Car[];
  selectedCarId: string;
  selectedCar: Car | null;
  maintenanceItems: MaintenanceScheduleItem[];
  todoItems: TodoItem[];
  recentEntries: Entry[];
  initialEntryType?: EntryType;
  initialShowAdvanced?: boolean;
  preselectedMaintenanceItemId?: string | null;
  preselectedTodoItemId?: string | null;
}

export function EntryLogView({
  cars,
  selectedCarId,
  selectedCar,
  maintenanceItems,
  todoItems,
  recentEntries,
  initialEntryType = "fuel",
  initialShowAdvanced = false,
  preselectedMaintenanceItemId = null,
  preselectedTodoItemId = null,
}: EntryLogViewProps) {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [showAdvanced, setShowAdvanced] = React.useState(initialShowAdvanced);
  const [activeTab, setActiveTab] = React.useState<EntryType>(initialEntryType);
  const [isNavigating, startTransition] = React.useTransition();
  const [carSelectValue, setCarSelectValue] = React.useState(selectedCarId);
  const [linkedMaintenanceItemId, setLinkedMaintenanceItemId] =
    React.useState(preselectedMaintenanceItemId ?? NONE_OPTION);
  const [linkedTodoId, setLinkedTodoId] = React.useState(
    preselectedTodoItemId ?? NONE_OPTION
  );
  const [formVersion, setFormVersion] = React.useState(0);

  React.useEffect(() => {
    setCarSelectValue(selectedCarId);
  }, [selectedCarId]);

  React.useEffect(() => {
    setActiveTab(initialEntryType);
    setShowAdvanced(initialShowAdvanced);
    setLinkedMaintenanceItemId(preselectedMaintenanceItemId ?? NONE_OPTION);
    setLinkedTodoId(preselectedTodoItemId ?? NONE_OPTION);
    setFormVersion((version) => version + 1);
  }, [
    selectedCarId,
    initialEntryType,
    initialShowAdvanced,
    preselectedMaintenanceItemId,
    preselectedTodoItemId,
  ]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!selectedCarId) {
      toast.error("Please select a car first.");
      return;
    }

    setSaving(true);
    const formData = new FormData(form);
    formData.set("car_id", selectedCarId);
    formData.set("entry_type", activeTab);
    formData.set("maintenance_item_id", linkedMaintenanceItemId);
    formData.set("todo_id", linkedTodoId);

    try {
      const payload = buildCreateEntryPayloadFromFormData(formData);
      const response = await fetch("/api/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responsePayload = (await response.json().catch(() => null)) as
        | { data?: { id?: string } }
        | { error?: { message?: string } }
        | null;

      if (!response.ok) {
        const errorMessage =
          responsePayload && "error" in responsePayload
            ? responsePayload.error?.message
            : undefined;
        throw new Error(errorMessage || "Failed to save entry.");
      }

      toast.success("Entry logged!", {
        description: selectedCar
          ? `Updated ${selectedCar.name} to ${payload.mileage.toLocaleString()} mi`
          : undefined,
      });

      form.reset();
      setShowAdvanced(false);
      setLinkedMaintenanceItemId(NONE_OPTION);
      setLinkedTodoId(NONE_OPTION);
      setFormVersion((version) => version + 1);
      startTransition(() => {
        router.replace(`/entries?car=${encodeURIComponent(selectedCarId)}`, {
          scroll: false,
        });
        router.refresh();
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save entry."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleCarChange(nextCarId: string) {
    setCarSelectValue(nextCarId);
    startTransition(() => {
      router.replace(`/entries?car=${encodeURIComponent(nextCarId)}`, {
        scroll: false,
      });
    });
  }

  if (cars.length === 0 || !selectedCar) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center px-4 py-8 text-center">
        <div className="rounded-full bg-primary/10 p-3 text-primary">
          <Plus className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-xl font-bold tracking-tight text-foreground">
          Add a car before logging entries
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Entries are tied to a specific car. Create your first car, then come
          back here to log fuel, expenses, and service.
        </p>
        <Button asChild className="mt-5">
          <Link href="/cars/new">Add Car</Link>
        </Button>
      </div>
    );
  }

  const today = getLocalDateInputValue();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-4 pb-28 md:px-6 md:py-6 md:pb-8 lg:py-8">
      <div className="mb-5 md:mb-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
          Log Entry
        </h1>
        <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">
          Record a fuel stop, expense, or completed service for the selected car.
        </p>
      </div>

      <div className="mb-4 space-y-1.5">
        <Label htmlFor="car_select" className="text-xs md:text-sm">
          Vehicle
        </Label>
        <Select
          value={carSelectValue}
          onValueChange={handleCarChange}
          disabled={isNavigating}
        >
          <SelectTrigger id="car_select" className="h-10">
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

      <div className="mb-4 flex gap-2">
        {entryTabs.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setActiveTab(tab.value);
                setShowAdvanced(false);
                setLinkedMaintenanceItemId(NONE_OPTION);
                setLinkedTodoId(NONE_OPTION);
                setFormVersion((version) => version + 1);
              }}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all active:scale-[0.98] md:text-sm",
                isActive
                  ? cn(tab.activeBg, tab.color)
                  : "border-border bg-card text-muted-foreground hover:bg-accent"
              )}
            >
              <tab.icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
              {tab.shortLabel}
            </button>
          );
        })}
      </div>

      <form
        key={`${selectedCarId}:${activeTab}:${formVersion}`}
        onSubmit={handleSubmit}
        className="space-y-4 pb-16 md:pb-0"
      >
        <input type="hidden" name="car_id" value={selectedCarId} />
        <input type="hidden" name="entry_type" value={activeTab} />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="date" className="text-xs">
              Date *
            </Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={today}
              max={today}
              required
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mileage" className="text-xs">
              Odometer (mi) *
            </Label>
            <Input
              id="mileage"
              name="mileage"
              type="number"
              inputMode="numeric"
              min={selectedCar.current_mileage}
              placeholder={selectedCar.current_mileage.toString()}
              required
              className="h-10"
            />
          </div>
        </div>

        {activeTab === "fuel" && (
          <div className="rounded-xl border border-border bg-muted/30 p-3 md:p-4">
            <h3 className="mb-3 text-xs font-semibold text-card-foreground md:text-sm">
              Fuel Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="fuel_gallons" className="text-xs">
                  Gallons *
                </Label>
                <Input
                  id="fuel_gallons"
                  name="fuel_gallons"
                  type="number"
                  inputMode="decimal"
                  step="0.001"
                  min={0}
                  placeholder="12.500"
                  required
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fuel_price_per_gallon" className="text-xs">
                  $/Gallon *
                </Label>
                <Input
                  id="fuel_price_per_gallon"
                  name="fuel_price_per_gallon"
                  type="number"
                  inputMode="decimal"
                  step="0.001"
                  min={0}
                  placeholder="3.299"
                  required
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fuel_station" className="text-xs">
                  Station
                </Label>
                <Input
                  id="fuel_station"
                  name="fuel_station"
                  placeholder="Shell, Costco..."
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fuel_octane" className="text-xs">
                  Octane
                </Label>
                <Select name="fuel_octane" defaultValue="87">
                  <SelectTrigger id="fuel_octane" className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="87">87 Regular</SelectItem>
                    <SelectItem value="89">89 Mid</SelectItem>
                    <SelectItem value="91">91 Premium</SelectItem>
                    <SelectItem value="93">93 Super</SelectItem>
                    <SelectItem value="diesel">Diesel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Switch id="was_full_tank" name="was_full_tank" defaultChecked />
              <Label
                htmlFor="was_full_tank"
                className="text-xs font-normal md:text-sm"
              >
                Full tank fill-up
              </Label>
            </div>
          </div>
        )}

        {activeTab === "maintenance_expense" && (
          <div className="rounded-xl border border-border bg-muted/30 p-3 md:p-4">
            <h3 className="mb-3 text-xs font-semibold text-card-foreground md:text-sm">
              Expense Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="expense_amount_me" className="text-xs">
                  Amount ($) *
                </Label>
                <Input
                  id="expense_amount_me"
                  name="expense_amount"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={0}
                  placeholder="85.00"
                  required
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expense_category_me" className="text-xs">
                  Category
                </Label>
                <Select name="expense_category" defaultValue="regular_maintenance">
                  <SelectTrigger id="expense_category_me" className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular_maintenance">Regular</SelectItem>
                    <SelectItem value="preventive_maintenance">Preventive</SelectItem>
                    <SelectItem value="improvements">Improvement</SelectItem>
                    <SelectItem value="repairs">Repair</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="description_me" className="text-xs">
                  Description *
                </Label>
                <Input
                  id="description_me"
                  name="description"
                  placeholder="Oil change, brake pads..."
                  required
                  className="h-10"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="vendor_me" className="text-xs">
                  Vendor / Shop
                </Label>
                <Input
                  id="vendor_me"
                  name="vendor"
                  placeholder="Jiffy Lube, Dealer..."
                  className="h-10"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="parts_replaced_me" className="text-xs">
                  Parts Replaced
                </Label>
                <Input
                  id="parts_replaced_me"
                  name="parts_replaced"
                  placeholder="Oil filter, brake pads..."
                  className="h-10"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "maintenance_done" && (
          <div className="rounded-xl border border-border bg-muted/30 p-3 md:p-4">
            <h3 className="mb-3 text-xs font-semibold text-card-foreground md:text-sm">
              Service Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="description_md" className="text-xs">
                  Description *
                </Label>
                <Input
                  id="description_md"
                  name="description"
                  placeholder="Oil change, tire rotation..."
                  required
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expense_category_md" className="text-xs">
                  Category
                </Label>
                <Select name="expense_category" defaultValue="regular_maintenance">
                  <SelectTrigger id="expense_category_md" className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular_maintenance">Regular</SelectItem>
                    <SelectItem value="preventive_maintenance">Preventive</SelectItem>
                    <SelectItem value="improvements">Improvement</SelectItem>
                    <SelectItem value="repairs">Repair</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expense_amount_md" className="text-xs">
                  Cost ($)
                </Label>
                <Input
                  id="expense_amount_md"
                  name="expense_amount"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={0}
                  placeholder="Optional"
                  className="h-10"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="vendor_md" className="text-xs">
                  Vendor / Shop
                </Label>
                <Input
                  id="vendor_md"
                  name="vendor"
                  placeholder="Self, Dealer..."
                  className="h-10"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="parts_replaced_md" className="text-xs">
                  Parts Replaced
                </Label>
                <Input
                  id="parts_replaced_md"
                  name="parts_replaced"
                  placeholder="Engine oil, filter..."
                  className="h-10"
                />
              </div>
            </div>
          </div>
        )}

        {(activeTab === "maintenance_expense" ||
          activeTab === "maintenance_done") &&
          (maintenanceItems.length > 0 || todoItems.length > 0) && (
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced((current) => !current)}
                className="flex w-full items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                <span>Link to schedule / task</span>
                {showAdvanced ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
              {showAdvanced && (
                <div className="mt-2 space-y-3">
                  {maintenanceItems.length > 0 && (
                    <div className="space-y-1.5">
                      <Label htmlFor="maintenance_item_id" className="text-xs">
                        Maintenance Schedule Item
                      </Label>
                      <Select
                        name="maintenance_item_id"
                        value={linkedMaintenanceItemId}
                        onValueChange={setLinkedMaintenanceItemId}
                      >
                        <SelectTrigger id="maintenance_item_id" className="h-10">
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE_OPTION}>None</SelectItem>
                          {maintenanceItems.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name}
                              {item.next_due_mileage
                                ? ` (due at ${item.next_due_mileage.toLocaleString()} mi)`
                                : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-muted-foreground">
                        Resets the maintenance interval on the linked item.
                      </p>
                    </div>
                  )}
                  {todoItems.length > 0 && (
                    <div className="space-y-1.5">
                      <Label htmlFor="todo_id" className="text-xs">
                        To-Do Item
                      </Label>
                      <Select
                        name="todo_id"
                        value={linkedTodoId}
                        onValueChange={setLinkedTodoId}
                      >
                        <SelectTrigger id="todo_id" className="h-10">
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE_OPTION}>None</SelectItem>
                          {todoItems.map((todo) => (
                            <SelectItem key={todo.id} value={todo.id}>
                              {todo.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-muted-foreground">
                        Marks the linked task as completed inside the same write.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        <div className="space-y-1.5">
          <Label htmlFor="notes" className="text-xs">
            Notes
          </Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Additional details..."
            rows={2}
            className="resize-none"
          />
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md safe-bottom-pad md:static md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
          <Button
            type="submit"
            disabled={saving || isNavigating}
            className="h-11 w-full text-sm font-semibold"
            size="lg"
          >
            {saving ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Saving...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Entry
              </div>
            )}
          </Button>
        </div>
      </form>

      <section className="mt-6 rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-card-foreground md:text-base">
              Recent Entries
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Recent real entries for {selectedCar.name}.
            </p>
          </div>
        </div>
        {recentEntries.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No entries logged for this car yet.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentEntries.map((entry) => (
              <RecentEntryRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
