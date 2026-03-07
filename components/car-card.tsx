"use client";

import Link from "next/link";
import type { Car } from "@/lib/db/schema";
import { formatCurrency, formatMileage } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Car as CarIcon, Fuel, Wrench, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const colorDotMap: Record<string, string> = {
  "Midnight Black": "bg-zinc-900 dark:bg-zinc-300",
  "Race Red": "bg-red-500",
  "Lunar Silver": "bg-zinc-400",
  White: "bg-white border border-border",
  Blue: "bg-blue-500",
  default: "bg-muted-foreground",
};

function getColorDot(color: string | null) {
  if (!color) return colorDotMap.default;
  return colorDotMap[color] ?? colorDotMap.default;
}

export function CarCard({ car }: { car: Car }) {
  const totalSpent =
    car.total_fuel_spent +
    car.total_maintenance_spent +
    car.total_improvements_spent +
    car.total_repairs_spent;

  return (
    <Link href={`/cars/${car.id}`} className="group block">
      <div className="relative overflow-hidden rounded-xl border border-border bg-card p-3.5 transition-all hover:border-primary/30 hover:shadow-lg active:scale-[0.99] md:p-5">
        {/* Top section */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5 md:gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary md:h-11 md:w-11">
              <CarIcon className="h-4.5 w-4.5 md:h-5.5 md:w-5.5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-card-foreground md:text-base">
                {car.name}
              </h3>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground md:text-sm">
                <span
                  className={cn(
                    "inline-block h-2 w-2 rounded-full md:h-2.5 md:w-2.5",
                    getColorDot(car.color)
                  )}
                  aria-hidden
                />
                {car.year} {car.make} {car.model}
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </div>

        {/* Stats row */}
        <div className="mt-3 grid grid-cols-3 gap-2 md:mt-5 md:gap-3">
          <div className="rounded-lg bg-muted/50 px-2 py-2 md:px-3 md:py-2.5">
            <span className="block text-[9px] font-medium uppercase tracking-wider text-muted-foreground md:text-[11px]">
              Mileage
            </span>
            <span className="mt-0.5 block text-xs font-semibold text-card-foreground md:text-sm">
              {formatMileage(car.current_mileage)}
            </span>
          </div>
          <div className="rounded-lg bg-muted/50 px-2 py-2 md:px-3 md:py-2.5">
            <span className="flex items-center gap-1 text-[9px] font-medium uppercase tracking-wider text-muted-foreground md:text-[11px]">
              <Fuel className="h-2.5 w-2.5" /> Fuel
            </span>
            <span className="mt-0.5 block text-xs font-semibold text-card-foreground md:text-sm">
              {formatCurrency(car.total_fuel_spent)}
            </span>
          </div>
          <div className="rounded-lg bg-muted/50 px-2 py-2 md:px-3 md:py-2.5">
            <span className="flex items-center gap-1 text-[9px] font-medium uppercase tracking-wider text-muted-foreground md:text-[11px]">
              <Wrench className="h-2.5 w-2.5" /> Service
            </span>
            <span className="mt-0.5 block text-xs font-semibold text-card-foreground md:text-sm">
              {formatCurrency(car.total_maintenance_spent)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between md:mt-4">
          <Badge
            variant="secondary"
            className="text-[10px] font-normal md:text-xs"
          >
            Total: {formatCurrency(totalSpent)}
          </Badge>
          {car.license_plate && (
            <span className="font-mono text-[10px] text-muted-foreground md:text-xs">
              {car.license_plate}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
