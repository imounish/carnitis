import type { Car, MaintenanceScheduleItem } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { formatMileage, getStatusLabel } from "@/lib/format";
import { AlertTriangle, Clock, CheckCircle2 } from "lucide-react";

const statusStyles = {
  overdue: { icon: AlertTriangle, bg: "bg-destructive/10", text: "text-destructive", badge: "bg-destructive/15 text-destructive" },
  due_soon: { icon: Clock, bg: "bg-warning/10", text: "text-warning", badge: "bg-warning/15 text-warning-foreground" },
  upcoming: { icon: Clock, bg: "bg-muted", text: "text-muted-foreground", badge: "bg-muted text-muted-foreground" },
  completed: { icon: CheckCircle2, bg: "bg-success/10", text: "text-success", badge: "bg-success/15 text-success" },
};

export function MaintenanceAlertRow({
  item,
}: {
  item: MaintenanceScheduleItem & { car?: Car };
}) {
  const style = statusStyles[item.status];
  const Icon = style.icon;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          style.bg,
          style.text
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-card-foreground">
          {item.name}
        </span>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {item.car && <span>{item.car.name}</span>}
          {item.next_due_mileage != null && (
            <>
              <span>{"·"}</span>
              <span>Due at {formatMileage(item.next_due_mileage)}</span>
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
        {getStatusLabel(item.status)}
      </span>
    </div>
  );
}
