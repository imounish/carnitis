import { z } from "zod";
import type { CreateEntryInput } from "./types";

const expenseCategories = [
  "fuel",
  "preventive_maintenance",
  "regular_maintenance",
  "improvements",
  "repairs",
] as const;

const nullableTrimmedString = z.string().trim().nullable();
const nonEmptyString = z.string().trim().min(1);
const isoDateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const numberField = z.number().finite().nonnegative();

const fuelPayloadSchema = z.object({
  car_id: nonEmptyString,
  entry_type: z.literal("fuel"),
  date: isoDateString,
  mileage: numberField,
  fuel_gallons: numberField.positive(),
  fuel_price_per_gallon: numberField.positive(),
  fuel_station: nullableTrimmedString.optional().default(null),
  fuel_octane: nullableTrimmedString.optional().default(null),
  was_full_tank: z.boolean().optional().default(false),
  description: nullableTrimmedString.optional().default(null),
  vendor: nullableTrimmedString.optional().default(null),
  notes: nullableTrimmedString.optional().default(null),
});

const maintenanceExpensePayloadSchema = z.object({
  car_id: nonEmptyString,
  entry_type: z.literal("maintenance_expense"),
  date: isoDateString,
  mileage: numberField,
  expense_category: z.enum(expenseCategories).optional().default("regular_maintenance"),
  expense_amount: numberField.positive(),
  description: nonEmptyString,
  vendor: nullableTrimmedString.optional().default(null),
  parts_replaced: nullableTrimmedString.optional().default(null),
  maintenance_item_id: nullableTrimmedString.optional().default(null),
  todo_id: nullableTrimmedString.optional().default(null),
  notes: nullableTrimmedString.optional().default(null),
});

const maintenanceDonePayloadSchema = z.object({
  car_id: nonEmptyString,
  entry_type: z.literal("maintenance_done"),
  date: isoDateString,
  mileage: numberField,
  expense_category: z.enum(expenseCategories).optional().default("regular_maintenance"),
  expense_amount: numberField.positive().nullable().optional().default(null),
  description: nonEmptyString,
  vendor: nullableTrimmedString.optional().default(null),
  parts_replaced: nullableTrimmedString.optional().default(null),
  maintenance_item_id: nullableTrimmedString.optional().default(null),
  todo_id: nullableTrimmedString.optional().default(null),
  notes: nullableTrimmedString.optional().default(null),
});

export const createEntryPayloadSchema = z.discriminatedUnion("entry_type", [
  fuelPayloadSchema,
  maintenanceExpensePayloadSchema,
  maintenanceDonePayloadSchema,
]);

type CreateEntryPayloadParseResult =
  | {
      success: true;
      data: CreateEntryInput;
    }
  | {
      success: false;
      error: z.ZodError<unknown>;
    };

export function safeParseCreateEntryPayload(
  payload: unknown
): CreateEntryPayloadParseResult {
  const parsed = createEntryPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error,
    };
  }

  return {
    success: true,
    data: normalizeCreateEntryPayload(parsed.data),
  };
}

function getTrimmedValue(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function getOptionalTextValue(formData: FormData, key: string) {
  const value = getTrimmedValue(formData, key);
  return value || null;
}

function getRequiredNumberValue(formData: FormData, key: string) {
  return Number(getTrimmedValue(formData, key));
}

function getOptionalPositiveNumberValue(formData: FormData, key: string) {
  const value = getTrimmedValue(formData, key);
  if (!value) {
    return null;
  }

  return Number(value);
}

function getOptionalLinkedId(formData: FormData, key: string) {
  const value = getTrimmedValue(formData, key);
  if (!value || value === "_none") {
    return null;
  }

  return value;
}

export function buildCreateEntryPayloadFromFormData(formData: FormData) {
  const entryType = getTrimmedValue(formData, "entry_type");

  if (entryType === "fuel") {
    return normalizeCreateEntryPayload(
      fuelPayloadSchema.parse({
      car_id: getTrimmedValue(formData, "car_id"),
      entry_type: "fuel",
      date: getTrimmedValue(formData, "date"),
      mileage: getRequiredNumberValue(formData, "mileage"),
      fuel_gallons: getRequiredNumberValue(formData, "fuel_gallons"),
      fuel_price_per_gallon: getRequiredNumberValue(
        formData,
        "fuel_price_per_gallon"
      ),
      fuel_station: getOptionalTextValue(formData, "fuel_station"),
      fuel_octane: getOptionalTextValue(formData, "fuel_octane"),
      was_full_tank: formData.get("was_full_tank") === "on",
      description: getOptionalTextValue(formData, "description"),
      vendor: getOptionalTextValue(formData, "vendor"),
      notes: getOptionalTextValue(formData, "notes"),
      })
    );
  }

  if (entryType === "maintenance_expense") {
    return normalizeCreateEntryPayload(
      maintenanceExpensePayloadSchema.parse({
      car_id: getTrimmedValue(formData, "car_id"),
      entry_type: "maintenance_expense",
      date: getTrimmedValue(formData, "date"),
      mileage: getRequiredNumberValue(formData, "mileage"),
      expense_category: getTrimmedValue(formData, "expense_category") || "regular_maintenance",
      expense_amount: getRequiredNumberValue(formData, "expense_amount"),
      description: getTrimmedValue(formData, "description"),
      vendor: getOptionalTextValue(formData, "vendor"),
      parts_replaced: getOptionalTextValue(formData, "parts_replaced"),
      maintenance_item_id: getOptionalLinkedId(formData, "maintenance_item_id"),
      todo_id: getOptionalLinkedId(formData, "todo_id"),
      notes: getOptionalTextValue(formData, "notes"),
      })
    );
  }

  return normalizeCreateEntryPayload(
    maintenanceDonePayloadSchema.parse({
    car_id: getTrimmedValue(formData, "car_id"),
    entry_type: "maintenance_done",
    date: getTrimmedValue(formData, "date"),
    mileage: getRequiredNumberValue(formData, "mileage"),
    expense_category: getTrimmedValue(formData, "expense_category") || "regular_maintenance",
    expense_amount: getOptionalPositiveNumberValue(formData, "expense_amount"),
    description: getTrimmedValue(formData, "description"),
    vendor: getOptionalTextValue(formData, "vendor"),
    parts_replaced: getOptionalTextValue(formData, "parts_replaced"),
    maintenance_item_id: getOptionalLinkedId(formData, "maintenance_item_id"),
    todo_id: getOptionalLinkedId(formData, "todo_id"),
    notes: getOptionalTextValue(formData, "notes"),
    })
  );
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function formatCompactNumber(value: number) {
  return value % 1 === 0 ? String(value) : value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function normalizeCreateEntryPayload(
  value:
    | z.infer<typeof fuelPayloadSchema>
    | z.infer<typeof maintenanceExpensePayloadSchema>
    | z.infer<typeof maintenanceDonePayloadSchema>
): CreateEntryInput {
  if (value.entry_type === "fuel") {
    const totalCost = roundCurrency(
      value.fuel_gallons * value.fuel_price_per_gallon
    );

    return {
      car_id: value.car_id,
      entry_type: value.entry_type,
      date: value.date,
      mileage: value.mileage,
      fuel_gallons: value.fuel_gallons,
      fuel_price_per_gallon: value.fuel_price_per_gallon,
      fuel_total_cost: totalCost,
      fuel_station: value.fuel_station,
      fuel_octane: value.fuel_octane,
      was_full_tank: value.was_full_tank,
      expense_category: "fuel",
      expense_amount: totalCost,
      description:
        value.description ?? `Fuel - ${formatCompactNumber(value.fuel_gallons)} gal`,
      vendor: value.vendor ?? value.fuel_station,
      parts_replaced: null,
      maintenance_item_id: null,
      todo_id: null,
      notes: value.notes,
    };
  }

  if (value.entry_type === "maintenance_expense") {
    return {
      car_id: value.car_id,
      entry_type: value.entry_type,
      date: value.date,
      mileage: value.mileage,
      fuel_gallons: null,
      fuel_price_per_gallon: null,
      fuel_total_cost: null,
      fuel_station: null,
      fuel_octane: null,
      was_full_tank: null,
      expense_category: value.expense_category,
      expense_amount: roundCurrency(value.expense_amount),
      description: value.description,
      vendor: value.vendor,
      parts_replaced: value.parts_replaced,
      maintenance_item_id: value.maintenance_item_id,
      todo_id: value.todo_id,
      notes: value.notes,
    };
  }

  return {
    car_id: value.car_id,
    entry_type: value.entry_type,
    date: value.date,
    mileage: value.mileage,
    fuel_gallons: null,
    fuel_price_per_gallon: null,
    fuel_total_cost: null,
    fuel_station: null,
    fuel_octane: null,
    was_full_tank: null,
    expense_category: value.expense_category,
    expense_amount:
      value.expense_amount == null ? null : roundCurrency(value.expense_amount),
    description: value.description,
    vendor: value.vendor,
    parts_replaced: value.parts_replaced,
    maintenance_item_id: value.maintenance_item_id,
    todo_id: value.todo_id,
    notes: value.notes,
  };
}
