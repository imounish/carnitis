import type { Car } from "@/lib/db/schema";
import type { CreateCarInput, UpdateCarInput } from "@/lib/db/types";
import { getTodayLocalDateString } from "@/lib/time";

const fuelTypeFallback = "gasoline";
const editableCarKeys = [
  "name",
  "make",
  "model",
  "year",
  "vin",
  "color",
  "license_plate",
  "current_mileage",
  "mileage_as_of_date",
  "mileage_check_interval_days",
  "fuel_tank_capacity",
  "fuel_type",
  "notes",
] as const;

type CarFormSeed = Pick<
  Car,
  | "name"
  | "make"
  | "model"
  | "year"
  | "vin"
  | "color"
  | "license_plate"
  | "current_mileage"
  | "mileage_as_of_date"
  | "mileage_check_interval_days"
  | "fuel_tank_capacity"
  | "fuel_type"
  | "notes"
>;

export type EditableCarInput = Omit<CreateCarInput, "image_url">;

export interface CarFormValues {
  name: string;
  make: string;
  model: string;
  year: string;
  vin: string;
  color: string;
  license_plate: string;
  current_mileage: string;
  mileage_as_of_date: string;
  mileage_check_interval_days: string;
  fuel_tank_capacity: string;
  fuel_type: string;
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

function getNormalizedFuelType(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed || fuelTypeFallback;
}

function buildEditableCarInput(formData: FormData): EditableCarInput {
  return {
    name: getTrimmedValue(formData, "name"),
    make: getTrimmedValue(formData, "make"),
    model: getTrimmedValue(formData, "model"),
    year: getRequiredNumberValue(formData, "year"),
    vin: getOptionalTextValue(formData, "vin"),
    color: getOptionalTextValue(formData, "color"),
    license_plate: getOptionalTextValue(formData, "license_plate"),
    current_mileage: getRequiredNumberValue(formData, "current_mileage"),
    mileage_as_of_date: getTrimmedValue(formData, "mileage_as_of_date") || getTodayLocalDateString(),
    mileage_check_interval_days: getRequiredNumberValue(formData, "mileage_check_interval_days") || 14,
    fuel_tank_capacity: getOptionalNumberValue(formData, "fuel_tank_capacity"),
    fuel_type: getNormalizedFuelType(getTrimmedValue(formData, "fuel_type")),
    notes: getOptionalTextValue(formData, "notes"),
  };
}

export function getDefaultCarFormValues(): CarFormValues {
  return {
    name: "",
    make: "",
    model: "",
    year: "",
    vin: "",
    color: "",
    license_plate: "",
    current_mileage: "",
    mileage_as_of_date: getTodayLocalDateString(),
    mileage_check_interval_days: "14",
    fuel_tank_capacity: "",
    fuel_type: fuelTypeFallback,
    notes: "",
  };
}

export function getCarFormValues(car: CarFormSeed): CarFormValues {
  return {
    name: car.name,
    make: car.make,
    model: car.model,
    year: String(car.year),
    vin: car.vin ?? "",
    color: car.color ?? "",
    license_plate: car.license_plate ?? "",
    current_mileage: String(car.current_mileage),
    mileage_as_of_date: car.mileage_as_of_date,
    mileage_check_interval_days: String(car.mileage_check_interval_days),
    fuel_tank_capacity: car.fuel_tank_capacity == null ? "" : String(car.fuel_tank_capacity),
    fuel_type: getNormalizedFuelType(car.fuel_type),
    notes: car.notes ?? "",
  };
}

export function getEditableCarInputFromCar(car: CarFormSeed): EditableCarInput {
  return {
    name: car.name,
    make: car.make,
    model: car.model,
    year: car.year,
    vin: car.vin,
    color: car.color,
    license_plate: car.license_plate,
    current_mileage: car.current_mileage,
    mileage_as_of_date: car.mileage_as_of_date,
    mileage_check_interval_days: car.mileage_check_interval_days,
    fuel_tank_capacity: car.fuel_tank_capacity,
    fuel_type: getNormalizedFuelType(car.fuel_type),
    notes: car.notes,
  };
}

export function buildCreateCarInput(formData: FormData): CreateCarInput {
  return {
    ...buildEditableCarInput(formData),
    image_url: null,
  };
}

export function buildUpdateCarInput(
  formData: FormData,
  initialInput: EditableCarInput
): UpdateCarInput {
  const nextInput = buildEditableCarInput(formData);
  return Object.fromEntries(
    editableCarKeys
      .filter((key) => nextInput[key] !== initialInput[key])
      .map((key) => [key, nextInput[key]])
  ) as UpdateCarInput;
}
