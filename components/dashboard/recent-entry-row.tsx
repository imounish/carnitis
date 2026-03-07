import type { Car, Entry } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import {
  formatCurrency,
  formatDateRelative,
  formatMileage,
  getEntryTypeLabel,
  getCategoryLabel,
} from "@/lib/format";
import { Fuel, Wrench, Settings, DollarSign } from "lucide-react";

const entryTypeIcon = {
  fuel: Fuel,
  maintenance_expense: DollarSign,
  maintenance_done: Settings,
};

const entryTypeColor = {
  fuel: "bg-chart-3/15 text-chart-3",
  maintenance_expense: "bg-chart-1/15 text-chart-1",
  maintenance_done: "bg-chart-2/15 text-chart-2",
};

export function RecentEntryRow({
  entry,
}: {
  entry: Entry & { car?: Car };
}) {
  const Icon = entryTypeIcon[entry.entry_type] ?? Wrench;
  const colorClass =
    entryTypeColor[entry.entry_type] ?? "bg-muted text-muted-foreground";
  const amount = entry.fuel_total_cost ?? entry.expense_amount;

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 md:px-4 md:py-3">
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg md:h-9 md:w-9",
          colorClass
        )}
      >
        <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium text-card-foreground">
            {entry.description || getEntryTypeLabel(entry.entry_type)}
          </span>
          {amount != null && (
            <span className="shrink-0 text-sm font-semibold text-card-foreground">
              {formatCurrency(amount)}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0 text-[11px] text-muted-foreground md:text-xs">
          {entry.car && (
            <>
              <span className="truncate">{entry.car.name}</span>
              <span>{"·"}</span>
            </>
          )}
          <span>{formatMileage(entry.mileage)}</span>
          <span>{"·"}</span>
          <span>{formatDateRelative(entry.date)}</span>
          {entry.expense_category && (
            <span className="ml-1 hidden rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium sm:inline-block">
              {getCategoryLabel(entry.expense_category)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
