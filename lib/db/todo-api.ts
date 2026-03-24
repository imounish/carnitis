import { z } from "zod";
import type { CreateTodoInput, UpdateTodoInput } from "@/lib/db/types";
import {
  getUserSafeErrorMessage,
  normalizeDataAccessError,
} from "@/lib/db/errors";
import {
  getEmptyTodoUpdatePayloadErrorPayload,
  getInvalidTodoPayloadErrorPayload,
  getTodoCarNotFoundErrorPayload,
  getTodoNotFoundErrorPayload,
  getUnauthorizedTodoErrorPayload,
  type TodoApiErrorPayload,
} from "@/lib/db/todo-api-payloads";
import { normalizeDirectTodoUpdates } from "@/lib/db/todo-helpers";

const expenseCategories = [
  "fuel",
  "preventive_maintenance",
  "regular_maintenance",
  "improvements",
  "repairs",
] as const;

const todoPriorities = ["low", "medium", "high", "urgent"] as const;
const todoStatuses = [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
] as const;

const isoDateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const nonEmptyString = z.string().trim().min(1);
const nullableTrimmedString = z.string().trim().nullable();
const numberField = z.number().finite().nonnegative();

const editableTodoPayloadSchema = z.object({
  title: nonEmptyString,
  description: nullableTrimmedString,
  priority: z.enum(todoPriorities),
  status: z.enum(todoStatuses),
  category: z.enum(expenseCategories).nullable(),
  estimated_cost: numberField.nullable(),
  due_date: isoDateString.nullable(),
});

const createTodoPayloadSchema = editableTodoPayloadSchema
  .omit({ status: true })
  .extend({
    car_id: nonEmptyString,
  });

const updateTodoPayloadSchema = editableTodoPayloadSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one todo field must be provided.",
  });

export type CreateTodoPayload = z.infer<typeof createTodoPayloadSchema>;
export type UpdateTodoPayload = z.infer<typeof updateTodoPayloadSchema>;

export function parseCreateTodoPayload(payload: unknown) {
  return createTodoPayloadSchema.safeParse(payload);
}

export function parseUpdateTodoPayload(payload: unknown) {
  return updateTodoPayloadSchema.safeParse(payload);
}

export function buildCreateTodoInput(payload: CreateTodoPayload): CreateTodoInput {
  return {
    car_id: payload.car_id,
    title: payload.title,
    description: payload.description,
    priority: payload.priority,
    status: "pending",
    category: payload.category,
    estimated_cost: payload.estimated_cost,
    due_date: payload.due_date,
  };
}

export function buildDirectTodoUpdateInput(
  payload: UpdateTodoPayload,
  now = new Date()
): UpdateTodoInput {
  return normalizeDirectTodoUpdates(payload, now);
}

export function getTodoApiErrorPayload(error: unknown): {
  status: number;
  body: TodoApiErrorPayload;
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
  getUnauthorizedTodoErrorPayload,
  getInvalidTodoPayloadErrorPayload,
  getEmptyTodoUpdatePayloadErrorPayload,
  getTodoNotFoundErrorPayload,
  getTodoCarNotFoundErrorPayload,
};
