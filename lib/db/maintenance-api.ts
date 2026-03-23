import { z } from "zod";
import type {
  MaintenanceScheduleItem,
  MaintenanceItemStatus,
} from "@/lib/db/schema";
import type {
  CreateMaintenanceItemInput,
  UpdateMaintenanceItemInput,
} from "@/lib/db/types";
import {
  calculateNextDueFields,
  deriveMaintenanceStatus,
} from "@/lib/db/maintenance-scheduling";
import {
  getUserSafeErrorMessage,
  normalizeDataAccessError,
} from "@/lib/db/errors";
import {
  getEmptyMaintenanceUpdatePayloadErrorPayload,
  getInvalidMaintenancePayloadErrorPayload,
  getMaintenanceCarNotFoundErrorPayload,
  getMaintenanceNotFoundErrorPayload,
  getUnauthorizedMaintenanceErrorPayload,
  type MaintenanceApiErrorPayload,
} from "@/lib/db/maintenance-api-payloads";

const isoDateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const nonEmptyString = z.string().trim().min(1);
const nullableTrimmedString = z.string().trim().nullable();
const numberField = z.number().finite().nonnegative();

const editableMaintenancePayloadSchema = z.object({
  name: nonEmptyString,
  description: nullableTrimmedString,
  interval_miles: numberField.min(1),
  interval_months: z.number().int().positive().nullable(),
  last_done_mileage: numberField.nullable(),
  last_done_date: isoDateString.nullable(),
  estimated_cost: numberField.nullable(),
  notes: nullableTrimmedString,
});

const createMaintenancePayloadSchema = editableMaintenancePayloadSchema.extend({
  car_id: nonEmptyString,
});

const updateMaintenancePayloadSchema = editableMaintenancePayloadSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one maintenance field must be provided.",
  });

export type CreateMaintenancePayload = z.infer<
  typeof createMaintenancePayloadSchema
>;
export type UpdateMaintenancePayload = z.infer<
  typeof updateMaintenancePayloadSchema
>;

function normalizeStatus(
  status: Exclude<MaintenanceItemStatus, "completed">
): MaintenanceItemStatus {
  return status;
}

export function parseCreateMaintenancePayload(payload: unknown) {
  return createMaintenancePayloadSchema.safeParse(payload);
}

export function parseUpdateMaintenancePayload(payload: unknown) {
  return updateMaintenancePayloadSchema.safeParse(payload);
}

export function buildCreateMaintenanceInput(
  payload: CreateMaintenancePayload,
  currentMileage: number
): CreateMaintenanceItemInput {
  const nextDue = calculateNextDueFields(payload, { currentMileage });
  const status = deriveMaintenanceStatus({
    interval_miles: payload.interval_miles,
    currentMileage,
    next_due_mileage: nextDue.next_due_mileage,
    next_due_date: nextDue.next_due_date,
  });

  return {
    car_id: payload.car_id,
    name: payload.name,
    description: payload.description,
    interval_miles: payload.interval_miles,
    interval_months: payload.interval_months,
    last_done_mileage: payload.last_done_mileage,
    last_done_date: payload.last_done_date,
    next_due_mileage: nextDue.next_due_mileage,
    next_due_date: nextDue.next_due_date,
    status: normalizeStatus(status),
    estimated_cost: payload.estimated_cost,
    notes: payload.notes,
  };
}

export function buildUpdateMaintenanceInput(
  payload: UpdateMaintenancePayload,
  item: MaintenanceScheduleItem,
  currentMileage: number
): UpdateMaintenanceItemInput {
  const merged = {
    name: payload.name ?? item.name,
    description:
      payload.description === undefined ? item.description : payload.description,
    interval_miles: payload.interval_miles ?? item.interval_miles,
    interval_months:
      payload.interval_months === undefined
        ? item.interval_months
        : payload.interval_months,
    last_done_mileage:
      payload.last_done_mileage === undefined
        ? item.last_done_mileage
        : payload.last_done_mileage,
    last_done_date:
      payload.last_done_date === undefined
        ? item.last_done_date
        : payload.last_done_date,
    estimated_cost:
      payload.estimated_cost === undefined
        ? item.estimated_cost
        : payload.estimated_cost,
    notes: payload.notes === undefined ? item.notes : payload.notes,
  };

  const nextDue = calculateNextDueFields(merged, { currentMileage });
  const status = deriveMaintenanceStatus({
    interval_miles: merged.interval_miles,
    currentMileage,
    next_due_mileage: nextDue.next_due_mileage,
    next_due_date: nextDue.next_due_date,
  });

  return {
    ...payload,
    next_due_mileage: nextDue.next_due_mileage,
    next_due_date: nextDue.next_due_date,
    status: normalizeStatus(status),
  };
}

export function getMaintenanceApiErrorPayload(error: unknown): {
  status: number;
  body: MaintenanceApiErrorPayload;
} {
  const normalized = normalizeDataAccessError(error);

  return {
    status: normalized.status,
    body: {
      error: {
        code: normalized.code,
        message: getUserSafeErrorMessage(normalized),
      },
    },
  };
}

export {
  getUnauthorizedMaintenanceErrorPayload,
  getInvalidMaintenancePayloadErrorPayload,
  getEmptyMaintenanceUpdatePayloadErrorPayload,
  getMaintenanceNotFoundErrorPayload,
  getMaintenanceCarNotFoundErrorPayload,
};
