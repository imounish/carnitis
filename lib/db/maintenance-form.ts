import type { MaintenanceScheduleItem } from "./schema.js";

const editableMaintenanceKeys = [
  "name",
  "description",
  "interval_miles",
  "interval_months",
  "last_done_mileage",
  "last_done_date",
  "estimated_cost",
  "notes",
] as const;

type MaintenanceFormSeed = Pick<
  MaintenanceScheduleItem,
  | "name"
  | "description"
  | "interval_miles"
  | "interval_months"
  | "last_done_mileage"
  | "last_done_date"
  | "estimated_cost"
  | "notes"
>;

export interface EditableMaintenancePayload {
  name: string;
  description: string | null;
  interval_miles: number;
  interval_months: number | null;
  last_done_mileage: number | null;
  last_done_date: string | null;
  estimated_cost: number | null;
  notes: string | null;
}

export interface CreateMaintenancePayload extends EditableMaintenancePayload {
  car_id: string;
}

export type UpdateMaintenancePayload = Partial<EditableMaintenancePayload>;

export interface MaintenanceFormValues {
  name: string;
  description: string;
  interval_miles: string;
  interval_months: string;
  last_done_mileage: string;
  last_done_date: string;
  estimated_cost: string;
  notes: string;
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
  const value = getTrimmedValue(formData, key);
  return value ? Number(value) : 0;
}

function getOptionalNumberValue(formData: FormData, key: string) {
  const value = getTrimmedValue(formData, key);
  return value ? Number(value) : null;
}

function buildEditableMaintenancePayload(
  formData: FormData
): EditableMaintenancePayload {
  return {
    name: getTrimmedValue(formData, "name"),
    description: getOptionalTextValue(formData, "description"),
    interval_miles: getRequiredNumberValue(formData, "interval_miles"),
    interval_months: getOptionalNumberValue(formData, "interval_months"),
    last_done_mileage: getOptionalNumberValue(formData, "last_done_mileage"),
    last_done_date: getOptionalTextValue(formData, "last_done_date"),
    estimated_cost: getOptionalNumberValue(formData, "estimated_cost"),
    notes: getOptionalTextValue(formData, "notes"),
  };
}

export function getDefaultMaintenanceFormValues(): MaintenanceFormValues {
  return {
    name: "",
    description: "",
    interval_miles: "",
    interval_months: "",
    last_done_mileage: "",
    last_done_date: "",
    estimated_cost: "",
    notes: "",
  };
}

export function getMaintenanceFormValues(
  item: MaintenanceFormSeed
): MaintenanceFormValues {
  return {
    name: item.name,
    description: item.description ?? "",
    interval_miles: String(item.interval_miles),
    interval_months:
      item.interval_months == null ? "" : String(item.interval_months),
    last_done_mileage:
      item.last_done_mileage == null ? "" : String(item.last_done_mileage),
    last_done_date: item.last_done_date ?? "",
    estimated_cost:
      item.estimated_cost == null ? "" : String(item.estimated_cost),
    notes: item.notes ?? "",
  };
}

export function getEditableMaintenancePayloadFromItem(
  item: MaintenanceFormSeed
): EditableMaintenancePayload {
  return {
    name: item.name,
    description: item.description,
    interval_miles: item.interval_miles,
    interval_months: item.interval_months,
    last_done_mileage: item.last_done_mileage,
    last_done_date: item.last_done_date,
    estimated_cost: item.estimated_cost,
    notes: item.notes,
  };
}

export function buildCreateMaintenancePayload(
  formData: FormData,
  carId: string
): CreateMaintenancePayload {
  return {
    car_id: carId,
    ...buildEditableMaintenancePayload(formData),
  };
}

export function buildUpdateMaintenancePayload(
  formData: FormData,
  initialInput: EditableMaintenancePayload
): UpdateMaintenancePayload {
  const nextInput = buildEditableMaintenancePayload(formData);

  return Object.fromEntries(
    editableMaintenanceKeys
      .filter((key) => nextInput[key] !== initialInput[key])
      .map((key) => [key, nextInput[key]])
  ) as UpdateMaintenancePayload;
}
