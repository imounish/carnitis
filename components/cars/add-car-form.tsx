"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createCar } from "@/lib/db/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export function AddCarForm() {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const fd = new FormData(e.currentTarget);

    try {
      await createCar({
        name: fd.get("name") as string,
        make: fd.get("make") as string,
        model: fd.get("model") as string,
        year: Number(fd.get("year")),
        vin: (fd.get("vin") as string) || null,
        color: (fd.get("color") as string) || null,
        license_plate: (fd.get("license_plate") as string) || null,
        current_mileage: Number(fd.get("current_mileage")) || 0,
        fuel_tank_capacity: fd.get("fuel_tank_capacity")
          ? Number(fd.get("fuel_tank_capacity"))
          : null,
        fuel_type: (fd.get("fuel_type") as string) || "gasoline",
        image_url: null,
        notes: (fd.get("notes") as string) || null,
      });
      toast.success("Car added successfully!");
      router.push("/cars");
    } catch {
      toast.error("Failed to add car. Please try again.");
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
        <Link href="/cars">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to cars
        </Link>
      </Button>

      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Add a New Car
        </h1>
        <p className="text-sm text-muted-foreground">
          Fill in vehicle details to start tracking expenses and service history.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Nickname *</Label>
          <Input
            id="name"
            name="name"
            placeholder="e.g., Daily Driver"
            required
          />
          <p className="text-xs text-muted-foreground">
            A friendly name to identify this vehicle.
          </p>
        </div>

        {/* Make / Model / Year */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="make">Make *</Label>
            <Input id="make" name="make" placeholder="Toyota" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Model *</Label>
            <Input id="model" name="model" placeholder="Camry" required />
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
              placeholder="2024"
              required
            />
          </div>
        </div>

        {/* VIN / License Plate / Color */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="vin">VIN</Label>
            <Input
              id="vin"
              name="vin"
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
              placeholder="ABC-1234"
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <Input id="color" name="color" placeholder="Midnight Black" />
          </div>
        </div>

        {/* Mileage / Tank / Fuel Type */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="current_mileage">Current Mileage *</Label>
            <Input
              id="current_mileage"
              name="current_mileage"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="0"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fuel_tank_capacity">
              Tank Capacity (gal)
            </Label>
            <Input
              id="fuel_tank_capacity"
              name="fuel_tank_capacity"
              type="number"
              inputMode="decimal"
              step="0.1"
              min={0}
              placeholder="15.8"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fuel_type">Fuel Type</Label>
            <Select name="fuel_type" defaultValue="gasoline">
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

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Any additional details about this vehicle..."
            rows={3}
          />
        </div>

        {/* Submit */}
        <div className="fixed inset-x-0 bottom-0 z-40 flex gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md safe-bottom-pad sm:static sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
          <Button type="submit" disabled={saving} className="flex-1 sm:flex-none">
            <Save className="mr-1.5 h-4 w-4" />
            {saving ? "Saving..." : "Add Car"}
          </Button>
          <Button type="button" variant="outline" asChild className="flex-1 sm:flex-none">
            <Link href="/cars">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
