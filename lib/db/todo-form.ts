import type {
  ExpenseCategory,
  TodoItem,
  TodoPriority,
  TodoStatus,
} from "./schema.js";

const editableTodoKeys = [
  "title",
  "description",
  "priority",
  "status",
  "category",
  "estimated_cost",
  "due_date",
] as const;

type TodoFormSeed = Pick<
  TodoItem,
  | "title"
  | "description"
  | "priority"
  | "status"
  | "category"
  | "estimated_cost"
  | "due_date"
>;

export const TODO_FORM_NONE_OPTION = "_none";

export interface EditableTodoPayload {
  title: string;
  description: string | null;
  priority: TodoPriority;
  status: TodoStatus;
  category: ExpenseCategory | null;
  estimated_cost: number | null;
  due_date: string | null;
}

export interface CreateTodoPayload extends EditableTodoPayload {
  car_id: string;
}

export type UpdateTodoPayload = Partial<EditableTodoPayload>;

export interface TodoFormValues {
  title: string;
  description: string;
  priority: TodoPriority;
  status: TodoStatus;
  category: ExpenseCategory | typeof TODO_FORM_NONE_OPTION;
  estimated_cost: string;
  due_date: string;
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

function getOptionalNumberValue(formData: FormData, key: string) {
  const value = getTrimmedValue(formData, key);
  return value ? Number(value) : null;
}

function getCategoryValue(
  value: string
): ExpenseCategory | null {
  if (!value || value === TODO_FORM_NONE_OPTION) {
    return null;
  }

  return value as ExpenseCategory;
}

function buildEditableTodoPayload(formData: FormData): EditableTodoPayload {
  return {
    title: getTrimmedValue(formData, "title"),
    description: getOptionalTextValue(formData, "description"),
    priority: (getTrimmedValue(formData, "priority") || "medium") as TodoPriority,
    status: (getTrimmedValue(formData, "status") || "pending") as TodoStatus,
    category: getCategoryValue(getTrimmedValue(formData, "category")),
    estimated_cost: getOptionalNumberValue(formData, "estimated_cost"),
    due_date: getOptionalTextValue(formData, "due_date"),
  };
}

export function getDefaultTodoFormValues(): TodoFormValues {
  return {
    title: "",
    description: "",
    priority: "medium",
    status: "pending",
    category: TODO_FORM_NONE_OPTION,
    estimated_cost: "",
    due_date: "",
  };
}

export function getTodoFormValues(item: TodoFormSeed): TodoFormValues {
  return {
    title: item.title,
    description: item.description ?? "",
    priority: item.priority,
    status: item.status,
    category: item.category ?? TODO_FORM_NONE_OPTION,
    estimated_cost:
      item.estimated_cost == null ? "" : String(item.estimated_cost),
    due_date: item.due_date ?? "",
  };
}

export function getEditableTodoPayloadFromItem(
  item: TodoFormSeed
): EditableTodoPayload {
  return {
    title: item.title,
    description: item.description,
    priority: item.priority,
    status: item.status,
    category: item.category,
    estimated_cost: item.estimated_cost,
    due_date: item.due_date,
  };
}

export function buildCreateTodoPayload(
  formData: FormData,
  carId: string
): CreateTodoPayload {
  const nextInput = buildEditableTodoPayload(formData);

  return {
    car_id: carId,
    ...nextInput,
    status: "pending",
  };
}

export function buildUpdateTodoPayload(
  formData: FormData,
  initialInput: EditableTodoPayload
): UpdateTodoPayload {
  const nextInput = buildEditableTodoPayload(formData);

  return Object.fromEntries(
    editableTodoKeys
      .filter((key) => nextInput[key] !== initialInput[key])
      .map((key) => [key, nextInput[key]])
  ) as UpdateTodoPayload;
}
