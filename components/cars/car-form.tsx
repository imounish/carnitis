"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  buildCreateCarInput,
  buildUpdateCarInput,
  getDefaultCarFormValues,
  type EditableCarInput,
  type CarFormValues,
} from "@/lib/db/car-form";

interface CarFormProps {
  mode: "create";
  initialValues?: CarFormValues;
}

interface EditCarFormProps {
  mode: "edit";
  initialValues: CarFormValues;
  initialInput: EditableCarInput;
  carId: string;
}

export function CarForm(props: CarFormProps | EditCarFormProps) {
  const initialValues = props.initialValues ?? getDefaultCarFormValues();
  const mode = props.mode;
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const isEdit = mode === "edit";
  const carId = isEdit ? props.carId : undefined;
  const backHref = isEdit && carId ? `/cars/${carId}` : "/cars";
  const endpoint = isEdit && carId ? `/api/cars/${carId}` : "/api/cars";
  const method = isEdit ? "PATCH" : "POST";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const formData = new FormData(event.currentTarget);
    const body = isEdit
      ? buildUpdateCarInput(formData, props.initialInput)
      : buildCreateCarInput(formData);

    if (isEdit && Object.keys(body).length === 0) {
      toast.error("Make a change before saving.");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const payload = (await response.json().catch(() => null)) as
        | { data?: { id?: string } }
        | { error?: { message?: string } }
        | null;
      const errorMessage =
        payload && "error" in payload ? payload.error?.message : undefined;

      if (!response.ok) {
        throw new Error(
          errorMessage ||
            (isEdit ? "Failed to update car." : "Failed to add car.")
        );
      }

      toast.success(isEdit ? "Car updated successfully!" : "Car added successfully!");
      router.push(isEdit && carId ? `/cars/${carId}` : "/cars");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : isEdit
            ? "Failed to update car. Please try again."
            : "Failed to add car. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4 pb-28 md:px-6 md:py-6 lg:py-8 lg:pb-8">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="mb-3 h-9 px-2 text-muted-foreground"
      >
        <Link href={backHref}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          {isEdit ? "Back to car" : "Back to cars"}
        </Link>
      </Button>

      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {isEdit ? "Edit Car" : "Add a New Car"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isEdit
            ? "Update the vehicle details stored on this car record."
            : "Fill in vehicle details to start tracking expenses and service history."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Nickname *</Label>
          <Input
            id="name"
            name="name"
            defaultValue={initialValues.name}
            placeholder="e.g., Daily Driver"
            required
          />
          <p className="text-xs text-muted-foreground">
            A friendly name to identify this vehicle.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="make">Make *</Label>
            <Input
              id="make"
              name="make"
              defaultValue={initialValues.make}
              placeholder="Toyota"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Model *</Label>
            <Input
              id="model"
              name="model"
              defaultValue={initialValues.model}
              placeholder="Camry"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">Year *</Label>
            <Input
              id="year"
              name="year"
              type="number"
              inputMode="numeric"
              min={1900}
              max={2030}
              defaultValue={initialValues.year}
              placeholder="2024"
              required
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="vin">VIN</Label>
            <Input
              id="vin"
              name="vin"
              defaultValue={initialValues.vin}
              placeholder="17-character VIN"
              maxLength={17}
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="license_plate">License Plate</Label>
            <Input
              id="license_plate"
              name="license_plate"
              defaultValue={initialValues.license_plate}
              placeholder="ABC-1234"
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <Input
              id="color"
              name="color"
              defaultValue={initialValues.color}
              placeholder="Midnight Black"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="current_mileage">Current Mileage *</Label>
            <Input
              id="current_mileage"
              name="current_mileage"
              type="number"
              inputMode="numeric"
              min={0}
              defaultValue={initialValues.current_mileage}
              placeholder="0"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mileage_as_of_date">As of Date *</Label>
            <Input
              id="mileage_as_of_date"
              name="mileage_as_of_date"
              type="date"
              defaultValue={initialValues.mileage_as_of_date}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mileage_check_interval_days">Check Interval (days)</Label>
            <Input
              id="mileage_check_interval_days"
              name="mileage_check_interval_days"
              type="number"
              inputMode="numeric"
              min={1}
              max={365}
              defaultValue={initialValues.mileage_check_interval_days}
              placeholder="14"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="fuel_tank_capacity">Tank Capacity (gal)</Label>
            <Input
              id="fuel_tank_capacity"
              name="fuel_tank_capacity"
              type="number"
              inputMode="decimal"
              step="0.1"
              min={0}
              defaultValue={initialValues.fuel_tank_capacity}
              placeholder="15.8"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fuel_type">Fuel Type</Label>
            <Select name="fuel_type" defaultValue={initialValues.fuel_type}>
              <SelectTrigger id="fuel_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gasoline">Gasoline (Regular)</SelectItem>
                <SelectItem value="premium">Gasoline (Premium)</SelectItem>
                <SelectItem value="diesel">Diesel</SelectItem>
                <SelectItem value="electric">Electric</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="flex_fuel">Flex Fuel (E85)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={initialValues.notes}
            placeholder="Any additional details about this vehicle..."
            rows={3}
          />
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 flex gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md safe-bottom-pad sm:static sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
          <Button type="submit" disabled={saving} className="flex-1 sm:flex-none">
            <Save className="mr-1.5 h-4 w-4" />
            {saving
              ? isEdit
                ? "Saving..."
                : "Adding..."
              : isEdit
                ? "Save Changes"
                : "Add Car"}
          </Button>
          <Button
            type="button"
            variant="outline"
            asChild
            className="flex-1 sm:flex-none"
          >
            <Link href={backHref}>{isEdit ? "Cancel" : "Cancel"}</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
