import type { TodoItem, TodoPriority, TodoStatus } from "./schema.js";
import type { UpdateTodoInput } from "./types.js";

export const todoStatusOrder: Record<TodoStatus, number> = {
  in_progress: 0,
  pending: 1,
  completed: 2,
  cancelled: 3,
};

export const todoPriorityOrder: Record<TodoPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function compareTodos(
  left: Pick<TodoItem, "status" | "priority">,
  right: Pick<TodoItem, "status" | "priority">
) {
  if (todoStatusOrder[left.status] !== todoStatusOrder[right.status]) {
    return todoStatusOrder[left.status] - todoStatusOrder[right.status];
  }

  return todoPriorityOrder[left.priority] - todoPriorityOrder[right.priority];
}

export function isTodoActive(todo: Pick<TodoItem, "status">) {
  return todo.status === "pending" || todo.status === "in_progress";
}

export function normalizeDirectTodoUpdates(
  updates: UpdateTodoInput,
  now = new Date()
): UpdateTodoInput {
  const directUpdates = { ...updates };
  delete directUpdates.linked_entry_id;
  delete directUpdates.completed_at;

  if (directUpdates.status === undefined) {
    return directUpdates;
  }

  if (directUpdates.status === "completed") {
    return {
      ...directUpdates,
      linked_entry_id: null,
      completed_at: now.toISOString(),
    };
  }

  return {
    ...directUpdates,
    linked_entry_id: null,
    completed_at: null,
  };
}
