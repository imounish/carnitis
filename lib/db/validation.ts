import { z } from "zod";
import type {
  CreateCarInput,
  CreateEntryInput,
  CreateMaintenanceItemInput,
  CreateTodoInput,
  UpdateCarInput,
  UpdateMaintenanceItemInput,
  UpdateTodoInput,
} from "@/lib/db/types";

const expenseCategories = [
  "fuel",
  "preventive_maintenance",
  "regular_maintenance",
  "improvements",
  "repairs",
] as const;

const entryTypes = [
  "fuel",
  "maintenance_expense",
  "maintenance_done",
] as const;

const maintenanceStatuses = [
  "upcoming",
  "due_soon",
  "overdue",
  "completed",
] as const;

const todoStatuses = [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
] as const;

const todoPriorities = ["low", "medium", "high", "urgent"] as const;

const nullableTrimmedString = z.string().trim().nullable();
const nonEmptyString = z.string().trim().min(1);
const isoDateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const numberField = z.number().finite().nonnegative();

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const createCarInputSchema = z.object({
  name: nonEmptyString,
  make: nonEmptyString,
  model: nonEmptyString,
  year: z.number().int().min(1900).max(2100),
  vin: nullableTrimmedString,
  color: nullableTrimmedString,
  license_plate: nullableTrimmedString,
  current_mileage: numberField,
  fuel_tank_capacity: numberField.nullable(),
  fuel_type: nullableTrimmedString,
  image_url: z.string().url().nullable(),
  notes: nullableTrimmedString,
});

export const updateCarInputSchema = createCarInputSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one car field must be provided.",
  });

export const createEntryInputSchema = z.object({
  car_id: nonEmptyString,
  entry_type: z.enum(entryTypes),
  date: isoDateString.refine((value) => value <= getTodayDateString(), {
    message: "Entry date cannot be in the future.",
  }),
  mileage: numberField,
  fuel_gallons: numberField.nullable(),
  fuel_price_per_gallon: numberField.nullable(),
  fuel_total_cost: numberField.nullable(),
  fuel_station: nullableTrimmedString,
  fuel_octane: nullableTrimmedString,
  was_full_tank: z.boolean().nullable(),
  expense_category: z.enum(expenseCategories).nullable(),
  expense_amount: numberField.nullable(),
  description: nullableTrimmedString,
  vendor: nullableTrimmedString,
  parts_replaced: nullableTrimmedString,
  maintenance_item_id: nullableTrimmedString,
  todo_id: nullableTrimmedString,
  notes: nullableTrimmedString,
});

export const createMaintenanceItemInputSchema = z.object({
  car_id: nonEmptyString,
  name: nonEmptyString,
  description: nullableTrimmedString,
  interval_miles: numberField.min(1),
  interval_months: z.number().int().positive().nullable(),
  last_done_mileage: numberField.nullable(),
  last_done_date: isoDateString.nullable(),
  next_due_mileage: numberField.nullable(),
  next_due_date: isoDateString.nullable(),
  status: z.enum(maintenanceStatuses),
  estimated_cost: numberField.nullable(),
  notes: nullableTrimmedString,
});

export const updateMaintenanceItemInputSchema =
  createMaintenanceItemInputSchema
    .omit({ car_id: true })
    .partial()
    .refine((value) => Object.keys(value).length > 0, {
      message: "At least one maintenance field must be provided.",
    });

export const createTodoInputSchema = z.object({
  car_id: nonEmptyString,
  title: nonEmptyString,
  description: nullableTrimmedString,
  priority: z.enum(todoPriorities),
  status: z.enum(todoStatuses),
  category: z.enum(expenseCategories).nullable(),
  estimated_cost: numberField.nullable(),
  due_date: isoDateString.nullable(),
});

export const updateTodoInputSchema = z
  .object({
    title: nonEmptyString.optional(),
    description: nullableTrimmedString.optional(),
    priority: z.enum(todoPriorities).optional(),
    status: z.enum(todoStatuses).optional(),
    category: z.enum(expenseCategories).nullable().optional(),
    estimated_cost: numberField.nullable().optional(),
    linked_entry_id: nullableTrimmedString.optional(),
    due_date: isoDateString.nullable().optional(),
    completed_at: z.string().datetime().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one todo field must be provided.",
  });

export function parseCreateCarInput(input: CreateCarInput): CreateCarInput {
  return createCarInputSchema.parse(input);
}

export function parseUpdateCarInput(input: UpdateCarInput): UpdateCarInput {
  return updateCarInputSchema.parse(input);
}

export function parseCreateEntryInput(input: CreateEntryInput): CreateEntryInput {
  return createEntryInputSchema.parse(input);
}

export function parseCreateMaintenanceItemInput(
  input: CreateMaintenanceItemInput
): CreateMaintenanceItemInput {
  return createMaintenanceItemInputSchema.parse(input);
}

export function parseUpdateMaintenanceItemInput(
  input: UpdateMaintenanceItemInput
): UpdateMaintenanceItemInput {
  return updateMaintenanceItemInputSchema.parse(input);
}

export function parseCreateTodoInput(input: CreateTodoInput): CreateTodoInput {
  return createTodoInputSchema.parse(input);
}

export function parseUpdateTodoInput(
  input: UpdateTodoInput
): UpdateTodoInput {
  return updateTodoInputSchema.parse(input);
}
