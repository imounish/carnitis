"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  getCars,
  getMaintenanceByCarId,
  getTodosByCarId,
  createEntry,
} from "@/lib/db/api";
import type {
  Car,
  MaintenanceScheduleItem,
  TodoItem,
  EntryType,
  ExpenseCategory,
} from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Fuel,
  Wrench,
  Settings,
  Save,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

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

export function EntryLogView() {
  const searchParams = useSearchParams();
  const preselectedCar = searchParams.get("car");
  const [cars, setCars] = React.useState<Car[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedCarId, setSelectedCarId] = React.useState(
    preselectedCar ?? ""
  );
  const [activeTab, setActiveTab] = React.useState<EntryType>("fuel");
  const [maintenanceItems, setMaintenanceItems] = React.useState<
    MaintenanceScheduleItem[]
  >([]);
  const [todoItems, setTodoItems] = React.useState<TodoItem[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  React.useEffect(() => {
    getCars().then((c) => {
      setCars(c);
      if (!selectedCarId && c.length > 0) {
        setSelectedCarId(c[0].id);
      }
      setLoading(false);
    });
  }, []);

  React.useEffect(() => {
    if (selectedCarId) {
      Promise.all([
        getMaintenanceByCarId(selectedCarId),
        getTodosByCarId(selectedCarId),
      ]).then(([m, t]) => {
        setMaintenanceItems(m);
        setTodoItems(
          t.filter(
            (td) => td.status !== "completed" && td.status !== "cancelled"
          )
        );
      });
    }
  }, [selectedCarId]);

  const selectedCar = cars.find((c) => c.id === selectedCarId);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedCarId) {
      toast.error("Please select a car first.");
      return;
    }
    setSaving(true);
    const fd = new FormData(e.currentTarget);

    try {
      const mileage = Number(fd.get("mileage"));
      const maintenanceItemId =
        (fd.get("maintenance_item_id") as string) || null;
      const todoId = (fd.get("todo_id") as string) || null;
      const notes = (fd.get("notes") as string) || null;

      if (activeTab === "fuel") {
        const gallons = Number(fd.get("fuel_gallons"));
        const pricePerGallon = Number(fd.get("fuel_price_per_gallon"));
        const totalCost = gallons * pricePerGallon;
        const wasFullTank = fd.get("was_full_tank") === "on";

        await createEntry({
          car_id: selectedCarId,
          entry_type: "fuel",
          date: fd.get("date") as string,
          mileage,
          fuel_gallons: gallons,
          fuel_price_per_gallon: pricePerGallon,
          fuel_total_cost: totalCost,
          fuel_station: (fd.get("fuel_station") as string) || null,
          fuel_octane: (fd.get("fuel_octane") as string) || null,
          was_full_tank: wasFullTank,
          expense_category: "fuel",
          expense_amount: totalCost,
          description:
            (fd.get("description") as string) || `Fuel - ${gallons} gal`,
          vendor: (fd.get("fuel_station") as string) || null,
          parts_replaced: null,
          maintenance_item_id: null,
          todo_id: null,
          notes,
        });
      } else if (activeTab === "maintenance_expense") {
        await createEntry({
          car_id: selectedCarId,
          entry_type: "maintenance_expense",
          date: fd.get("date") as string,
          mileage,
          fuel_gallons: null,
          fuel_price_per_gallon: null,
          fuel_total_cost: null,
          fuel_station: null,
          fuel_octane: null,
          was_full_tank: null,
          expense_category:
            (fd.get("expense_category") as ExpenseCategory) ||
            "regular_maintenance",
          expense_amount: Number(fd.get("expense_amount")),
          description: (fd.get("description") as string) || null,
          vendor: (fd.get("vendor") as string) || null,
          parts_replaced: (fd.get("parts_replaced") as string) || null,
          maintenance_item_id:
            maintenanceItemId !== "_none" ? maintenanceItemId : null,
          todo_id: todoId !== "_none" ? todoId : null,
          notes,
        });
      } else {
        await createEntry({
          car_id: selectedCarId,
          entry_type: "maintenance_done",
          date: fd.get("date") as string,
          mileage,
          fuel_gallons: null,
          fuel_price_per_gallon: null,
          fuel_total_cost: null,
          fuel_station: null,
          fuel_octane: null,
          was_full_tank: null,
          expense_category:
            (fd.get("expense_category") as ExpenseCategory) ||
            "regular_maintenance",
          expense_amount: Number(fd.get("expense_amount") || 0) || null,
          description: (fd.get("description") as string) || null,
          vendor: (fd.get("vendor") as string) || null,
          parts_replaced: (fd.get("parts_replaced") as string) || null,
          maintenance_item_id:
            maintenanceItemId !== "_none" ? maintenanceItemId : null,
          todo_id: todoId !== "_none" ? todoId : null,
          notes,
        });
      }

      toast.success("Entry logged!", {
        description: selectedCar
          ? `Updated ${selectedCar.name} to ${mileage.toLocaleString()} mi`
          : undefined,
      });

      e.currentTarget.reset();
    } catch {
      toast.error("Failed to save entry.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-4 pb-28 md:px-6 md:py-6 md:pb-8 lg:py-8">
      <div className="mb-5 md:mb-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
          Log Entry
        </h1>
        <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">
          Record a fuel stop, expense, or service done.
        </p>
      </div>

      {/* Car selector */}
      <div className="mb-4 space-y-1.5">
        <Label htmlFor="car_select" className="text-xs md:text-sm">
          Vehicle
        </Label>
        <Select value={selectedCarId} onValueChange={setSelectedCarId}>
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
        {selectedCar && (
          <p className="text-[11px] text-muted-foreground">
            Current mileage: {selectedCar.current_mileage.toLocaleString()} mi
          </p>
        )}
      </div>

      {/* Entry type selector - pill style for mobile */}
      <div className="mb-4 flex gap-2">
        {entryTabs.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
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

      <form onSubmit={handleSubmit} className="space-y-4 pb-16 md:pb-0">
        {/* Common fields: date + mileage */}
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
              min={selectedCar?.current_mileage ?? 0}
              placeholder={selectedCar?.current_mileage?.toString() ?? "0"}
              required
              className="h-10"
            />
          </div>
        </div>

        {/* Fuel-specific fields */}
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
              <Switch
                id="was_full_tank"
                name="was_full_tank"
                defaultChecked
              />
              <Label
                htmlFor="was_full_tank"
                className="text-xs font-normal md:text-sm"
              >
                Full tank fill-up
              </Label>
            </div>
          </div>
        )}

        {/* Maintenance expense fields */}
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
                <Select
                  name="expense_category"
                  defaultValue="regular_maintenance"
                >
                  <SelectTrigger id="expense_category_me" className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular_maintenance">
                      Regular
                    </SelectItem>
                    <SelectItem value="preventive_maintenance">
                      Preventive
                    </SelectItem>
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

        {/* Maintenance done (no required cost) */}
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
                <Select
                  name="expense_category"
                  defaultValue="regular_maintenance"
                >
                  <SelectTrigger id="expense_category_md" className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular_maintenance">
                      Regular
                    </SelectItem>
                    <SelectItem value="preventive_maintenance">
                      Preventive
                    </SelectItem>
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

        {/* Advanced: Link to maintenance/todo - collapsible for mobile */}
        {(activeTab === "maintenance_expense" ||
          activeTab === "maintenance_done") &&
          (maintenanceItems.length > 0 || todoItems.length > 0) && (
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
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
                      <Label
                        htmlFor="maintenance_item_id"
                        className="text-xs"
                      >
                        Maintenance Schedule Item
                      </Label>
                      <Select
                        name="maintenance_item_id"
                        defaultValue="_none"
                      >
                        <SelectTrigger
                          id="maintenance_item_id"
                          className="h-10"
                        >
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">None</SelectItem>
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
                        Resets the maintenance interval.
                      </p>
                    </div>
                  )}
                  {todoItems.length > 0 && (
                    <div className="space-y-1.5">
                      <Label htmlFor="todo_id" className="text-xs">
                        To-Do Item
                      </Label>
                      <Select name="todo_id" defaultValue="_none">
                        <SelectTrigger id="todo_id" className="h-10">
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">None</SelectItem>
                          {todoItems.map((todo) => (
                            <SelectItem key={todo.id} value={todo.id}>
                              {todo.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-muted-foreground">
                        Marks this task as completed.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        {/* Notes */}
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

        {/* Submit */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md safe-bottom-pad md:static md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
          <Button
            type="submit"
            disabled={saving}
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
    </div>
  );
}
