import assert from "node:assert/strict";
import test from "node:test";
import { buildCreateCarInput } from "../lib/db/car-form.ts";

test("builds the create car payload from form data using current field rules", () => {
  const formData = new FormData();
  formData.set("name", "  Daily Driver  ");
  formData.set("make", " Toyota ");
  formData.set("model", " Camry ");
  formData.set("year", "2024");
  formData.set("vin", "  ");
  formData.set("color", " Black ");
  formData.set("license_plate", "  ");
  formData.set("current_mileage", "12345");
  formData.set("fuel_tank_capacity", "15.8");
  formData.set("fuel_type", "");
  formData.set("notes", "  Garage kept  ");

  const payload = buildCreateCarInput(formData);

  assert.equal(payload.name, "Daily Driver");
  assert.equal(payload.make, "Toyota");
  assert.equal(payload.model, "Camry");
  assert.equal(payload.year, 2024);
  assert.equal(payload.vin, null);
  assert.equal(payload.color, "Black");
  assert.equal(payload.license_plate, null);
  assert.equal(payload.current_mileage, 12345);
  assert.equal(payload.fuel_tank_capacity, 15.8);
  assert.equal(payload.fuel_type, "gasoline");
  assert.equal(payload.notes, "Garage kept");
});

test("keeps optional numeric fields nullable when omitted", () => {
  const formData = new FormData();
  formData.set("name", "Project Car");
  formData.set("make", "Ford");
  formData.set("model", "Mustang");
  formData.set("year", "2020");
  formData.set("current_mileage", "0");

  const payload = buildCreateCarInput(formData);

  assert.equal(payload.fuel_tank_capacity, null);
  assert.equal(payload.notes, null);
  assert.equal(payload.image_url, null);
});
