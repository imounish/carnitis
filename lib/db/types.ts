import type {
  Car,
  Entry,
  MaintenanceScheduleItem,
  TodoItem,
} from "@/lib/db/schema";

export type CreateCarInput = Omit<
  Car,
  | "id"
  | "created_at"
  | "updated_at"
  | "total_fuel_spent"
  | "total_maintenance_spent"
  | "total_improvements_spent"
  | "total_repairs_spent"
>;

export type UpdateCarInput = Partial<CreateCarInput>;

export type CreateEntryInput = Omit<Entry, "id" | "created_at" | "updated_at">;

export type CreateMaintenanceItemInput = Omit<
  MaintenanceScheduleItem,
  "id" | "created_at" | "updated_at"
>;

export type UpdateMaintenanceItemInput = Partial<
  Omit<MaintenanceScheduleItem, "id" | "created_at" | "updated_at" | "car_id">
>;

export type CreateTodoInput = Omit<
  TodoItem,
  "id" | "created_at" | "updated_at" | "completed_at" | "linked_entry_id"
>;

export type UpdateTodoInput = Partial<
  Omit<TodoItem, "id" | "created_at" | "updated_at" | "car_id">
>;
