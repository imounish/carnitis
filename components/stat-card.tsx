import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string | null;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  compact?: boolean;
  className?: string;
}

export function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  compact,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/20 hover:shadow-md",
        compact ? "p-3 md:p-5" : "p-5",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-0.5 md:gap-1">
          <span
            className={cn(
              "font-medium uppercase tracking-wider text-muted-foreground",
              compact ? "text-[10px] md:text-xs" : "text-xs"
            )}
          >
            {label}
          </span>
          <span
            className={cn(
              "font-bold tracking-tight text-card-foreground",
              compact ? "text-lg md:text-2xl" : "text-2xl"
            )}
          >
            {value}
          </span>
          {subtitle && (
            <span
              className={cn(
                "text-muted-foreground",
                compact ? "text-[10px] md:text-xs" : "text-xs"
              )}
            >
              {subtitle}
            </span>
          )}
          {trendLabel && (
            <span
              className={cn(
                "mt-0.5 text-xs font-medium",
                trend === "up" && "text-success",
                trend === "down" && "text-destructive",
                trend === "neutral" && "text-muted-foreground"
              )}
            >
              {trendLabel}
            </span>
          )}
        </div>
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15",
            compact
              ? "h-8 w-8 md:h-10 md:w-10"
              : "h-10 w-10"
          )}
        >
          <Icon className={cn(compact ? "h-4 w-4 md:h-5 md:w-5" : "h-5 w-5")} />
        </div>
      </div>
    </div>
  );
}
