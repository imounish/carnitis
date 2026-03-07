"use client";

import * as React from "react";
import {
  getCars,
  getTodosByCarId,
  createTodo,
  updateTodo,
} from "@/lib/db/api";
import type { Car, TodoItem, TodoPriority, TodoStatus, ExpenseCategory } from "@/lib/db/schema";
import {
  formatCurrency,
  formatDate,
  getPriorityLabel,
  getStatusLabel,
  getCategoryLabel,
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus,
  Circle,
  CircleDot,
  AlertCircle,
  Flame,
  CheckCircle2,
  Filter,
  ListTodo,
} from "lucide-react";

const priorityConfig = {
  low: { icon: Circle, color: "text-muted-foreground", badge: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  medium: { icon: CircleDot, color: "text-chart-1", badge: "bg-chart-1/15 text-chart-1", dot: "bg-chart-1" },
  high: { icon: AlertCircle, color: "text-warning", badge: "bg-warning/15 text-warning-foreground", dot: "bg-warning" },
  urgent: { icon: Flame, color: "text-destructive", badge: "bg-destructive/15 text-destructive", dot: "bg-destructive" },
};

const statusConfig: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-chart-1/15 text-chart-1",
  completed: "bg-success/15 text-success",
  cancelled: "bg-muted text-muted-foreground",
};

export function TodosView() {
  const [cars, setCars] = React.useState<Car[]>([]);
  const [selectedCarId, setSelectedCarId] = React.useState<string>("all");
  const [items, setItems] = React.useState<TodoItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [filter, setFilter] = React.useState<"all" | "active" | "completed">("active");

  React.useEffect(() => {
    getCars().then((c) => {
      setCars(c);
      setLoading(false);
    });
  }, []);

  React.useEffect(() => {
    async function loadTodos() {
      if (selectedCarId === "all") {
        const allTodos = await Promise.all(
          cars.map((c) => getTodosByCarId(c.id))
        );
        setItems(allTodos.flat());
      } else {
        const todos = await getTodosByCarId(selectedCarId);
        setItems(todos);
      }
    }
    if (cars.length > 0) loadTodos();
  }, [selectedCarId, cars]);

  async function handleAddTodo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const carId = fd.get("car_id") as string;
    if (!carId) {
      toast.error("Please select a car.");
      return;
    }

    try {
      const newTodo = await createTodo({
        car_id: carId,
        title: fd.get("title") as string,
        description: (fd.get("description") as string) || null,
        priority: (fd.get("priority") as TodoPriority) || "medium",
        status: "pending",
        category: (fd.get("category") as ExpenseCategory) || null,
        estimated_cost: fd.get("estimated_cost")
          ? Number(fd.get("estimated_cost"))
          : null,
        due_date: (fd.get("due_date") as string) || null,
      });
      setItems((prev) => [...prev, newTodo]);
      toast.success("Task added!");
      setDialogOpen(false);
    } catch {
      toast.error("Failed to add task.");
    }
  }

  async function handleToggleComplete(todo: TodoItem) {
    const newStatus: TodoStatus =
      todo.status === "completed" ? "pending" : "completed";
    const updated = await updateTodo(todo.id, {
      status: newStatus,
      completed_at: newStatus === "completed" ? new Date().toISOString() : null,
    });
    if (updated) {
      setItems((prev) => prev.map((t) => (t.id === todo.id ? updated : t)));
      toast.success(
        newStatus === "completed" ? "Task completed!" : "Task reopened."
      );
    }
  }

  const carNameMap = React.useMemo(
    () => new Map(cars.map((c) => [c.id, c.name])),
    [cars]
  );

  const filteredItems = items.filter((t) => {
    if (filter === "active")
      return t.status === "pending" || t.status === "in_progress";
    if (filter === "completed")
      return t.status === "completed" || t.status === "cancelled";
    return true;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    const pOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const sOrder = { in_progress: 0, pending: 1, completed: 2, cancelled: 3 };
    if (sOrder[a.status] !== sOrder[b.status])
      return sOrder[a.status] - sOrder[b.status];
    return pOrder[a.priority] - pOrder[b.priority];
  });

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const activeCount = items.filter(
    (t) => t.status === "pending" || t.status === "in_progress"
  ).length;
  const completedCount = items.filter(
    (t) => t.status === "completed"
  ).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-4 md:py-6 lg:px-6 lg:py-8">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between md:mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl lg:text-3xl">
            To-Do List
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">
            {activeCount} active, {completedCount} completed
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Add Task</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddTodo} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="todo_car">Vehicle *</Label>
                <Select name="car_id" required>
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
              <div className="space-y-2">
                <Label htmlFor="todo_title">Title *</Label>
                <Input
                  id="todo_title"
                  name="title"
                  placeholder="Replace wiper blades"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="todo_desc">Description</Label>
                <Textarea
                  id="todo_desc"
                  name="description"
                  placeholder="Details..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="todo_priority">Priority</Label>
                  <Select name="priority" defaultValue="medium">
                    <SelectTrigger id="todo_priority">
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
                  <Label htmlFor="todo_category">Category</Label>
                  <Select name="category">
                    <SelectTrigger id="todo_category">
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular_maintenance">
                        Maintenance
                      </SelectItem>
                      <SelectItem value="preventive_maintenance">
                        Preventive
                      </SelectItem>
                      <SelectItem value="improvements">
                        Improvement
                      </SelectItem>
                      <SelectItem value="repairs">Repair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="todo_cost">Est. Cost ($)</Label>
                  <Input
                    id="todo_cost"
                    name="estimated_cost"
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="todo_due">Due Date</Label>
                  <Input id="todo_due" name="due_date" type="date" />
                </div>
              </div>
              <Button type="submit" className="w-full">
                Add Task
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select value={selectedCarId} onValueChange={setSelectedCarId}>
          <SelectTrigger className="h-8 w-auto min-w-[120px] text-xs md:min-w-[180px] md:text-sm">
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

        <div className="flex rounded-lg border border-border bg-muted/50 p-0.5">
          {(["active", "completed", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors md:px-3 md:text-sm",
                filter === f
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f === "active" ? "Active" : f === "completed" ? "Done" : "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
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
              onToggleComplete={() => handleToggleComplete(todo)}
            />
          ))}
        </div>
      )}

      {/* Summary footer for mobile */}
      {items.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-3">
          <SummaryBox label="Active" value={activeCount} />
          <SummaryBox label="Completed" value={completedCount} />
          <SummaryBox
            label="Est. Cost"
            value={formatCurrency(
              items
                .filter(
                  (t) => t.status === "pending" || t.status === "in_progress"
                )
                .reduce((s, t) => s + (t.estimated_cost ?? 0), 0)
            )}
          />
        </div>
      )}
    </div>
  );
}

function TodoCard({
  todo,
  carName,
  onToggleComplete,
}: {
  todo: TodoItem;
  carName: string;
  onToggleComplete: () => void;
}) {
  const pConfig = priorityConfig[todo.priority];
  const isCompleted =
    todo.status === "completed" || todo.status === "cancelled";

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border border-border bg-card px-3 py-3 transition-all md:px-4",
        isCompleted && "opacity-60"
      )}
    >
      <Checkbox
        checked={isCompleted}
        onCheckedChange={onToggleComplete}
        className="mt-0.5 shrink-0"
        aria-label={`Mark "${todo.title}" as ${isCompleted ? "incomplete" : "complete"}`}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "text-sm font-medium text-card-foreground",
              isCompleted && "line-through"
            )}
          >
            {todo.title}
          </span>
          <div
            className={cn(
              "mt-0.5 h-2 w-2 shrink-0 rounded-full",
              pConfig.dot
            )}
            title={getPriorityLabel(todo.priority)}
          />
        </div>
        {todo.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {todo.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          <span>{carName}</span>
          {todo.category && (
            <>
              <span>{"·"}</span>
              <span>{getCategoryLabel(todo.category)}</span>
            </>
          )}
          {todo.estimated_cost != null && (
            <>
              <span>{"·"}</span>
              <span>~{formatCurrency(todo.estimated_cost)}</span>
            </>
          )}
          {todo.due_date && (
            <>
              <span>{"·"}</span>
              <span>Due {formatDate(todo.due_date)}</span>
            </>
          )}
          <Badge
            variant="secondary"
            className={cn(
              "ml-auto px-1.5 py-0 text-[10px]",
              statusConfig[todo.status]
            )}
          >
            {getStatusLabel(todo.status)}
          </Badge>
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
