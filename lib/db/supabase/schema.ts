import type { ColumnType, Selectable } from "kysely";

export type NumericValue = number | string;
export type TimestampValue = Date | string;
type IdColumn = ColumnType<string, string | undefined, never>;
type TimestampColumn = ColumnType<TimestampValue, TimestampValue | undefined, TimestampValue>;

export interface CarsTable {
  id: IdColumn;
  owner_user_id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  vin: string | null;
  color: string | null;
  license_plate: string | null;
  current_mileage: NumericValue;
  mileage_as_of_date: string;
  mileage_check_interval_days: number;
  fuel_tank_capacity: NumericValue | null;
  fuel_type: string | null;
  total_fuel_spent: NumericValue;
  total_maintenance_spent: NumericValue;
  total_improvements_spent: NumericValue;
  total_repairs_spent: NumericValue;
  image_url: string | null;
  notes: string | null;
  created_at: TimestampColumn;
  updated_at: TimestampColumn;
}

export interface EntriesTable {
  id: IdColumn;
  owner_user_id: string;
  car_id: string;
  entry_type: "fuel" | "maintenance_expense" | "maintenance_done";
  date: string;
  mileage: NumericValue;
  fuel_gallons: NumericValue | null;
  fuel_price_per_gallon: NumericValue | null;
  fuel_total_cost: NumericValue | null;
  fuel_station: string | null;
  fuel_octane: string | null;
  was_full_tank: boolean | null;
  fuel_level_before: number | null;
  expense_category:
    | "fuel"
    | "preventive_maintenance"
    | "regular_maintenance"
    | "improvements"
    | "repairs"
    | null;
  expense_amount: NumericValue | null;
  description: string | null;
  vendor: string | null;
  parts_replaced: string | null;
  maintenance_item_id: string | null;
  todo_id: string | null;
  notes: string | null;
  created_at: TimestampColumn;
  updated_at: TimestampColumn;
}

export interface MaintenanceScheduleItemsTable {
  id: IdColumn;
  owner_user_id: string;
  car_id: string;
  name: string;
  description: string | null;
  interval_miles: NumericValue;
  interval_months: number | null;
  last_done_mileage: NumericValue | null;
  last_done_date: string | null;
  next_due_mileage: NumericValue | null;
  next_due_date: string | null;
  status: "upcoming" | "due_soon" | "overdue" | "completed";
  estimated_cost: NumericValue | null;
  notes: string | null;
  created_at: TimestampColumn;
  updated_at: TimestampColumn;
}

export interface TodoItemsTable {
  id: IdColumn;
  owner_user_id: string;
  car_id: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  category:
    | "fuel"
    | "preventive_maintenance"
    | "regular_maintenance"
    | "improvements"
    | "repairs"
    | null;
  estimated_cost: NumericValue | null;
  linked_entry_id: string | null;
  due_date: string | null;
  completed_at: ColumnType<TimestampValue | null, TimestampValue | null, TimestampValue | null>;
  created_at: TimestampColumn;
  updated_at: TimestampColumn;
}

export interface UserProfilesTable {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  onboarding_completed: boolean;
  created_at: TimestampValue;
  updated_at: TimestampValue;
}

export interface AppDatabase {
  cars: CarsTable;
  entries: EntriesTable;
  maintenance_schedule_items: MaintenanceScheduleItemsTable;
  todo_items: TodoItemsTable;
  user_profiles: UserProfilesTable;
}

export type CarRow = Selectable<CarsTable>;
export type EntryRow = Selectable<EntriesTable>;
export type MaintenanceItemRow = Selectable<MaintenanceScheduleItemsTable>;
export type TodoRow = Selectable<TodoItemsTable>;
