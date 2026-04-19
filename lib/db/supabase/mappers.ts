import type { Car, Entry, MaintenanceScheduleItem, TodoItem } from "@/lib/db/schema";
import type {
  CarRow,
  EntryRow,
  MaintenanceItemRow,
  NumericValue,
  TimestampValue,
  TodoRow,
} from "@/lib/db/supabase/schema";

function toNumber(value: NumericValue | null): number | null {
  if (value === null) {
    return null;
  }

  return typeof value === "number" ? value : Number(value);
}

function toRequiredNumber(value: NumericValue): number {
  return typeof value === "number" ? value : Number(value);
}

function toIsoTimestamp(value: TimestampValue): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toIsoDateOnly(value: string | Date | null): string | null {
  if (value == null) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value;
}

export function mapCarRow(row: CarRow): Car {
  return {
    id: row.id,
    name: row.name,
    make: row.make,
    model: row.model,
    year: row.year,
    vin: row.vin,
    color: row.color,
    license_plate: row.license_plate,
    current_mileage: toRequiredNumber(row.current_mileage),
    mileage_as_of_date: toIsoDateOnly(row.mileage_as_of_date) ?? row.mileage_as_of_date,
    mileage_check_interval_days: row.mileage_check_interval_days,
    fuel_tank_capacity: toNumber(row.fuel_tank_capacity),
    fuel_type: row.fuel_type,
    total_fuel_spent: toRequiredNumber(row.total_fuel_spent),
    total_maintenance_spent: toRequiredNumber(row.total_maintenance_spent),
    total_improvements_spent: toRequiredNumber(row.total_improvements_spent),
    total_repairs_spent: toRequiredNumber(row.total_repairs_spent),
    image_url: row.image_url,
    notes: row.notes,
    created_at: toIsoTimestamp(row.created_at),
    updated_at: toIsoTimestamp(row.updated_at),
  };
}

export function mapEntryRow(row: EntryRow): Entry {
  return {
    id: row.id,
    car_id: row.car_id,
    entry_type: row.entry_type,
    date: toIsoDateOnly(row.date) ?? row.date,
    mileage: toRequiredNumber(row.mileage),
    fuel_gallons: toNumber(row.fuel_gallons),
    fuel_price_per_gallon: toNumber(row.fuel_price_per_gallon),
    fuel_total_cost: toNumber(row.fuel_total_cost),
    fuel_station: row.fuel_station,
    fuel_octane: row.fuel_octane,
    was_full_tank: row.was_full_tank,
    expense_category: row.expense_category,
    expense_amount: toNumber(row.expense_amount),
    description: row.description,
    vendor: row.vendor,
    parts_replaced: row.parts_replaced,
    maintenance_item_id: row.maintenance_item_id,
    todo_id: row.todo_id,
    notes: row.notes,
    created_at: toIsoTimestamp(row.created_at),
    updated_at: toIsoTimestamp(row.updated_at),
  };
}

export function mapMaintenanceItemRow(
  row: MaintenanceItemRow
): MaintenanceScheduleItem {
  return {
    id: row.id,
    car_id: row.car_id,
    name: row.name,
    description: row.description,
    interval_miles: toRequiredNumber(row.interval_miles),
    interval_months: row.interval_months,
    last_done_mileage: toNumber(row.last_done_mileage),
    last_done_date: toIsoDateOnly(row.last_done_date),
    next_due_mileage: toNumber(row.next_due_mileage),
    next_due_date: toIsoDateOnly(row.next_due_date),
    status: row.status,
    estimated_cost: toNumber(row.estimated_cost),
    notes: row.notes,
    created_at: toIsoTimestamp(row.created_at),
    updated_at: toIsoTimestamp(row.updated_at),
  };
}

export function mapTodoRow(row: TodoRow): TodoItem {
  return {
    id: row.id,
    car_id: row.car_id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    category: row.category,
    estimated_cost: toNumber(row.estimated_cost),
    linked_entry_id: row.linked_entry_id,
    due_date: toIsoDateOnly(row.due_date),
    completed_at:
      row.completed_at === null ? null : toIsoTimestamp(row.completed_at),
    created_at: toIsoTimestamp(row.created_at),
    updated_at: toIsoTimestamp(row.updated_at),
  };
}
