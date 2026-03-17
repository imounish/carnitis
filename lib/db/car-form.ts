import type { CreateCarInput } from "@/lib/db/types";

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

export function buildCreateCarInput(formData: FormData): CreateCarInput {
  const fuelType = getTrimmedValue(formData, "fuel_type");

  return {
    name: getTrimmedValue(formData, "name"),
    make: getTrimmedValue(formData, "make"),
    model: getTrimmedValue(formData, "model"),
    year: getRequiredNumberValue(formData, "year"),
    vin: getOptionalTextValue(formData, "vin"),
    color: getOptionalTextValue(formData, "color"),
    license_plate: getOptionalTextValue(formData, "license_plate"),
    current_mileage: getRequiredNumberValue(formData, "current_mileage"),
    fuel_tank_capacity: getOptionalNumberValue(formData, "fuel_tank_capacity"),
    fuel_type: fuelType || "gasoline",
    image_url: null,
    notes: getOptionalTextValue(formData, "notes"),
  };
}
