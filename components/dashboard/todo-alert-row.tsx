import type { Car, TodoItem } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate, getPriorityLabel } from "@/lib/format";
import { Circle, CircleDot, AlertCircle, Flame } from "lucide-react";

const priorityStyles = {
  low: { icon: Circle, color: "text-muted-foreground", badge: "bg-muted text-muted-foreground" },
  medium: { icon: CircleDot, color: "text-chart-1", badge: "bg-chart-1/15 text-chart-1" },
  high: { icon: AlertCircle, color: "text-warning", badge: "bg-warning/15 text-warning-foreground" },
  urgent: { icon: Flame, color: "text-destructive", badge: "bg-destructive/15 text-destructive" },
};

export function TodoAlertRow({
  todo,
}: {
  todo: TodoItem & { car?: Car };
}) {
  const style = priorityStyles[todo.priority];
  const Icon = style.icon;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <Icon className={cn("h-4.5 w-4.5 shrink-0", style.color)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-card-foreground">
          {todo.title}
        </span>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {todo.car && <span>{todo.car.name}</span>}
          {todo.estimated_cost != null && (
            <>
              <span>{"·"}</span>
              <span>~{formatCurrency(todo.estimated_cost)}</span>
            </>
          )}
          {todo.due_date && (
            <>
              <span>{"·"}</span>
              <span>{formatDate(todo.due_date)}</span>
            </>
          )}
        </div>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
          style.badge
        )}
      >
        {getPriorityLabel(todo.priority)}
      </span>
    </div>
  );
}
