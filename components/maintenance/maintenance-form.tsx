"use client";

import * as React from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getDefaultMaintenanceFormValues,
  type MaintenanceFormValues,
} from "@/lib/db/maintenance-form";

interface MaintenanceFormProps {
  mode: "create" | "edit";
  initialValues?: MaintenanceFormValues;
  saving: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

export function MaintenanceForm({
  mode,
  initialValues = getDefaultMaintenanceFormValues(),
  saving,
  onSubmit,
  onCancel,
}: MaintenanceFormProps) {
  const isEdit = mode === "edit";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${mode}_name`}>Name *</Label>
        <Input
          id={`${mode}_name`}
          name="name"
          defaultValue={initialValues.name}
          placeholder="Oil Change, Tire Rotation, etc."
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${mode}_description`}>Description</Label>
        <Input
          id={`${mode}_description`}
          name="description"
          defaultValue={initialValues.description}
          placeholder="Full synthetic 0W-20"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor={`${mode}_interval_miles`}>Interval (miles) *</Label>
          <Input
            id={`${mode}_interval_miles`}
            name="interval_miles"
            type="number"
            inputMode="numeric"
            min={1}
            defaultValue={initialValues.interval_miles}
            placeholder="7500"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${mode}_interval_months`}>Interval (months)</Label>
          <Input
            id={`${mode}_interval_months`}
            name="interval_months"
            type="number"
            inputMode="numeric"
            min={1}
            defaultValue={initialValues.interval_months}
            placeholder="6"
          />
        </div>
      </div>

      {isEdit && (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <h3 className="text-sm font-semibold text-card-foreground">
            Last Service
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Use these fields to move the maintenance schedule forward from an
            existing service record.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor={`${mode}_last_done_mileage`}>
                Last Done Mileage
              </Label>
              <Input
                id={`${mode}_last_done_mileage`}
                name="last_done_mileage"
                type="number"
                inputMode="numeric"
                min={0}
                defaultValue={initialValues.last_done_mileage}
                placeholder="42000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${mode}_last_done_date`}>Last Done Date</Label>
              <Input
                id={`${mode}_last_done_date`}
                name="last_done_date"
                type="date"
                defaultValue={initialValues.last_done_date}
              />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor={`${mode}_estimated_cost`}>Estimated Cost ($)</Label>
        <Input
          id={`${mode}_estimated_cost`}
          name="estimated_cost"
          type="number"
          inputMode="decimal"
          step="0.01"
          min={0}
          defaultValue={initialValues.estimated_cost}
          placeholder="85.00"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${mode}_notes`}>Notes</Label>
        <Textarea
          id={`${mode}_notes`}
          name="notes"
          defaultValue={initialValues.notes}
          placeholder="Any reminders or service notes..."
          rows={3}
        />
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          <Save className="mr-1.5 h-4 w-4" />
          {saving
            ? isEdit
              ? "Saving..."
              : "Adding..."
            : isEdit
              ? "Save Changes"
              : "Add Item"}
        </Button>
      </div>
    </form>
  );
}
