"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Car, TodoItem } from "@/lib/db/schema";
import {
  buildCreateTodoPayload,
  buildUpdateTodoPayload,
  getDefaultTodoFormValues,
  getEditableTodoPayloadFromItem,
  getTodoFormValues,
  TODO_FORM_NONE_OPTION,
  type TodoFormValues,
} from "@/lib/db/todo-form";
import { compareTodos, isTodoActive } from "@/lib/db/todo-helpers";
import {
  formatCurrency,
  formatDate,
  getCategoryLabel,
  getPriorityLabel,
  getStatusLabel,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AlertCircle,
  Circle,
  CircleDot,
  Flame,
  ListTodo,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

const priorityConfig = {
  low: {
    icon: Circle,
    color: "text-muted-foreground",
    badge: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  },
  medium: {
    icon: CircleDot,
    color: "text-chart-1",
    badge: "bg-chart-1/15 text-chart-1",
    dot: "bg-chart-1",
  },
  high: {
    icon: AlertCircle,
    color: "text-warning",
    badge: "bg-warning/15 text-warning-foreground",
    dot: "bg-warning",
  },
  urgent: {
    icon: Flame,
    color: "text-destructive",
    badge: "bg-destructive/15 text-destructive",
    dot: "bg-destructive",
  },
};

const statusConfig: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-chart-1/15 text-chart-1",
  completed: "bg-success/15 text-success",
  cancelled: "bg-muted text-muted-foreground",
};

interface TodosViewProps {
  cars: Car[];
  selectedCarId: string;
  items: TodoItem[];
}

function getResponseErrorMessage(
  payload: unknown,
  fallbackMessage: string
): string {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    payload.error &&
    typeof payload.error === "object" &&
    "message" in payload.error &&
    typeof payload.error.message === "string"
  ) {
    return payload.error.message;
  }

  return fallbackMessage;
}

export function TodosView({
  cars,
  selectedCarId,
  items,
}: TodosViewProps) {
  const router = useRouter();
  const [carSelectValue, setCarSelectValue] = React.useState(selectedCarId);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<TodoItem | null>(null);
  const [deleteCandidate, setDeleteCandidate] =
    React.useState<TodoItem | null>(null);
  const [savingCreate, setSavingCreate] = React.useState(false);
  const [savingEdit, setSavingEdit] = React.useState(false);
  const [togglingTodoId, setTogglingTodoId] = React.useState<string | null>(
    null
  );
  const [deleting, setDeleting] = React.useState(false);
  const [filter, setFilter] = React.useState<"all" | "active" | "completed">(
    "active"
  );
  const [isNavigating, startTransition] = React.useTransition();

  React.useEffect(() => {
    setCarSelectValue(selectedCarId);
  }, [selectedCarId]);

  const carNameMap = React.useMemo(
    () => new Map(cars.map((car) => [car.id, car.name])),
    [cars]
  );

  const filteredItems = items.filter((todo) => {
    if (filter === "active") {
      return isTodoActive(todo);
    }

    if (filter === "completed") {
      return !isTodoActive(todo);
    }

    return true;
  });

  const sortedItems = [...filteredItems].sort(compareTodos);
  const activeCount = items.filter(isTodoActive).length;
  const completedCount = items.filter((todo) => todo.status === "completed").length;
  const selectedCarName =
    selectedCarId === "all" ? null : carNameMap.get(selectedCarId) ?? null;

  function handleCarChange(nextCarId: string) {
    setCarSelectValue(nextCarId);
    startTransition(() => {
      router.replace(`/todos?car=${encodeURIComponent(nextCarId)}`, {
        scroll: false,
      });
    });
  }

  async function handleCreateTodo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    if (selectedCarId === "all" && cars.length === 0) {
      toast.error("Add a car before creating a task.");
      return;
    }

    const carId =
      selectedCarId === "all"
        ? String(formData.get("car_id") ?? "")
        : selectedCarId;

    if (!carId) {
      toast.error("Please select a car.");
      return;
    }

    setSavingCreate(true);

    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildCreateTodoPayload(formData, carId)),
      });

      const payload = (await response.json().catch(() => null)) as unknown;
      if (!response.ok) {
        throw new Error(getResponseErrorMessage(payload, "Failed to add task."));
      }

      setCreateDialogOpen(false);
      toast.success("Task added.");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add task."
      );
    } finally {
      setSavingCreate(false);
    }
  }

  async function handleEditTodo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingItem) {
      return;
    }

    const body = buildUpdateTodoPayload(
      new FormData(event.currentTarget),
      getEditableTodoPayloadFromItem(editingItem)
    );

    if (Object.keys(body).length === 0) {
      toast.error("Make a change before saving.");
      return;
    }

    setSavingEdit(true);

    try {
      const response = await fetch(`/api/todos/${editingItem.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const payload = (await response.json().catch(() => null)) as unknown;
      if (!response.ok) {
        throw new Error(
          getResponseErrorMessage(payload, "Failed to update task.")
        );
      }

      setEditingItem(null);
      toast.success("Task updated.");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update task."
      );
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleToggleComplete(todo: TodoItem) {
    const nextStatus = todo.status === "completed" ? "pending" : "completed";
    setTogglingTodoId(todo.id);

    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: nextStatus,
        }),
      });

      const payload = (await response.json().catch(() => null)) as unknown;
      if (!response.ok) {
        throw new Error(
          getResponseErrorMessage(payload, "Failed to update task status.")
        );
      }

      toast.success(
        nextStatus === "completed" ? "Task completed." : "Task reopened."
      );
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update task status."
      );
    } finally {
      setTogglingTodoId(null);
    }
  }

  async function handleDeleteTodo() {
    if (!deleteCandidate) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(`/api/todos/${deleteCandidate.id}`, {
        method: "DELETE",
      });

      const payload = (await response.json().catch(() => null)) as unknown;
      if (!response.ok) {
        throw new Error(
          getResponseErrorMessage(payload, "Failed to delete task.")
        );
      }

      setDeleteCandidate(null);
      toast.success("Task deleted.");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete task."
      );
    } finally {
      setDeleting(false);
    }
  }

  if (cars.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center px-4 py-8 text-center">
        <div className="rounded-full bg-primary/10 p-3 text-primary">
          <ListTodo className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-xl font-bold tracking-tight text-foreground">
          Add a car before tracking tasks
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tasks are tied to a specific car. Create your first car, then come
          back here to plan maintenance, repairs, and improvements.
        </p>
        <Button asChild className="mt-5">
          <Link href="/cars/new">Add Car</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-4 pb-24 md:px-6 md:py-6 md:pb-8 lg:py-8">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3 md:mb-6 md:items-end">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl lg:text-3xl">
            To-Do List
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">
            {activeCount} active, {completedCount} completed
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="hidden h-10 tap-target md:inline-flex">
              <Plus className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Add Task</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Task</DialogTitle>
              <DialogDescription>
                Create a task for the selected car and optionally link it to a
                future entry from the task card.
              </DialogDescription>
            </DialogHeader>
            <TodoForm
              mode="create"
              cars={cars}
              selectedCarId={selectedCarId}
              selectedCarName={selectedCarName}
              saving={savingCreate}
              onSubmit={handleCreateTodo}
              onCancel={() => setCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select
          value={carSelectValue}
          onValueChange={handleCarChange}
          disabled={isNavigating}
        >
          <SelectTrigger className="h-10 w-[170px] text-xs md:w-[220px] md:text-sm">
            <SelectValue placeholder="All cars" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cars</SelectItem>
            {cars.map((car) => (
              <SelectItem key={car.id} value={car.id}>
                {car.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex h-10 rounded-lg border border-border bg-muted/50 p-0.5">
          {(["active", "completed", "all"] as const).map((nextFilter) => (
            <button
              key={nextFilter}
              type="button"
              onClick={() => setFilter(nextFilter)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors md:px-3 md:text-sm",
                filter === nextFilter
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {nextFilter === "active"
                ? "Active"
                : nextFilter === "completed"
                  ? "Done"
                  : "All"}
            </button>
          ))}
        </div>
      </div>

      {sortedItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
          <ListTodo className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {filter === "active"
              ? "No active tasks. Add one to get started."
              : filter === "completed"
                ? "No completed tasks yet."
                : "No tasks for this selection."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sortedItems.map((todo) => (
            <TodoCard
              key={todo.id}
              todo={todo}
              carName={carNameMap.get(todo.car_id) ?? "Unknown"}
              toggling={togglingTodoId === todo.id}
              onToggleComplete={() => handleToggleComplete(todo)}
              onEdit={() => setEditingItem(todo)}
              onDelete={() => setDeleteCandidate(todo)}
            />
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-3">
          <SummaryBox label="Active" value={activeCount} />
          <SummaryBox label="Completed" value={completedCount} />
          <SummaryBox
            label="Est. Cost"
            value={formatCurrency(
              items
                .filter(isTodoActive)
                .reduce((sum, todo) => sum + (todo.estimated_cost ?? 0), 0)
            )}
          />
        </div>
      )}

      <Dialog
        open={editingItem !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingItem(null);
          }
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update the task details or direct status. Entry-linked completion
              still routes through the log-entry flow.
            </DialogDescription>
          </DialogHeader>
          {editingItem ? (
            <TodoForm
              key={editingItem.id}
              mode="edit"
              cars={cars}
              selectedCarId={editingItem.car_id}
              selectedCarName={carNameMap.get(editingItem.car_id) ?? null}
              initialValues={getTodoFormValues(editingItem)}
              saving={savingEdit}
              onSubmit={handleEditTodo}
              onCancel={() => setEditingItem(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteCandidate !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteCandidate(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the task. If it was previously completed
              from an entry, the entry itself remains in your history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteTodo}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete Task"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md safe-bottom-pad md:hidden">
        <Button
          type="button"
          onClick={() => setCreateDialogOpen(true)}
          className="h-11 w-full"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add Task
        </Button>
      </div>
    </div>
  );
}

function TodoForm({
  mode,
  cars,
  selectedCarId,
  selectedCarName,
  initialValues = getDefaultTodoFormValues(),
  saving,
  onSubmit,
  onCancel,
}: {
  mode: "create" | "edit";
  cars: Car[];
  selectedCarId: string;
  selectedCarName: string | null;
  initialValues?: TodoFormValues;
  saving: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  const showCarField = mode === "create" && selectedCarId === "all";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {showCarField ? (
        <div className="space-y-2">
          <Label htmlFor="todo_car">Vehicle *</Label>
          <Select name="car_id" required defaultValue={cars[0]?.id}>
            <SelectTrigger id="todo_car">
              <SelectValue placeholder="Select a car" />
            </SelectTrigger>
            <SelectContent>
              {cars.map((car) => (
                <SelectItem key={car.id} value={car.id}>
                  {car.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Vehicle:{" "}
          <span className="font-medium text-card-foreground">
            {selectedCarName ?? "Selected car"}
          </span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor={`${mode}_todo_title`}>Title *</Label>
        <Input
          id={`${mode}_todo_title`}
          name="title"
          defaultValue={initialValues.title}
          placeholder="Replace wiper blades"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${mode}_todo_desc`}>Description</Label>
        <Textarea
          id={`${mode}_todo_desc`}
          name="description"
          defaultValue={initialValues.description}
          placeholder="Details..."
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor={`${mode}_todo_priority`}>Priority</Label>
          <Select name="priority" defaultValue={initialValues.priority}>
            <SelectTrigger id={`${mode}_todo_priority`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${mode}_todo_category`}>Category</Label>
          <Select name="category" defaultValue={initialValues.category}>
            <SelectTrigger id={`${mode}_todo_category`}>
              <SelectValue placeholder="Optional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODO_FORM_NONE_OPTION}>Optional</SelectItem>
              <SelectItem value="regular_maintenance">Maintenance</SelectItem>
              <SelectItem value="preventive_maintenance">Preventive</SelectItem>
              <SelectItem value="improvements">Improvement</SelectItem>
              <SelectItem value="repairs">Repair</SelectItem>
              <SelectItem value="fuel">Fuel</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {mode === "edit" ? (
        <div className="space-y-2">
          <Label htmlFor="edit_todo_status">Status</Label>
          <Select name="status" defaultValue={initialValues.status}>
            <SelectTrigger id="edit_todo_status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor={`${mode}_todo_cost`}>Est. Cost ($)</Label>
          <Input
            id={`${mode}_todo_cost`}
            name="estimated_cost"
            type="number"
            inputMode="decimal"
            step="0.01"
            min={0}
            defaultValue={initialValues.estimated_cost}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${mode}_todo_due`}>Due Date</Label>
          <Input
            id={`${mode}_todo_due`}
            name="due_date"
            type="date"
            defaultValue={initialValues.due_date}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={saving}>
          {saving
            ? mode === "create"
              ? "Adding..."
              : "Saving..."
            : mode === "create"
              ? "Add Task"
              : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

function TodoCard({
  todo,
  carName,
  toggling,
  onToggleComplete,
  onEdit,
  onDelete,
}: {
  todo: TodoItem;
  carName: string;
  toggling: boolean;
  onToggleComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const pConfig = priorityConfig[todo.priority];
  const isCompleted = !isTodoActive(todo);

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card px-3 py-3 transition-all md:px-4",
        isCompleted && "opacity-70"
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={onToggleComplete}
          className="mt-0.5 shrink-0"
          disabled={toggling}
          aria-label={`Mark "${todo.title}" as ${isCompleted ? "incomplete" : "complete"}`}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span
                className={cn(
                  "text-sm font-medium text-card-foreground",
                  isCompleted && "line-through"
                )}
              >
                {todo.title}
              </span>
              {todo.linked_entry_id ? (
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Completed from a linked entry.
                </p>
              ) : null}
            </div>
            <div
              className={cn("mt-0.5 h-2 w-2 shrink-0 rounded-full", pConfig.dot)}
              title={getPriorityLabel(todo.priority)}
            />
          </div>

          {todo.description ? (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {todo.description}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            <span>{carName}</span>
            {todo.category ? (
              <>
                <span>{"·"}</span>
                <span>{getCategoryLabel(todo.category)}</span>
              </>
            ) : null}
            {todo.estimated_cost != null ? (
              <>
                <span>{"·"}</span>
                <span>~{formatCurrency(todo.estimated_cost)}</span>
              </>
            ) : null}
            {todo.due_date ? (
              <>
                <span>{"·"}</span>
                <span>Due {formatDate(todo.due_date)}</span>
              </>
            ) : null}
            <Badge
              variant="secondary"
              className={cn("ml-auto px-1.5 py-0 text-[10px]", statusConfig[todo.status])}
            >
              {getStatusLabel(todo.status)}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {isTodoActive(todo) ? (
              <Button asChild size="sm" variant="outline" className="h-8">
                <Link
                  href={`/entries?car=${encodeURIComponent(todo.car_id)}&todo=${encodeURIComponent(todo.id)}`}
                >
                  Log Entry
                </Link>
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-xs"
              onClick={onEdit}
            >
              <Pencil className="mr-1 h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-xs text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              Delete
            </Button>
            {toggling ? (
              <span className="text-[11px] text-muted-foreground">Saving...</span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryBox({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-center">
      <span className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="block text-sm font-bold text-card-foreground">
        {value}
      </span>
    </div>
  );
}
