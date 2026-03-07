"use client";

import { formatCurrency } from "@/lib/format";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface ExpenseDonutChartProps {
  fuel: number;
  maintenance: number;
  improvements: number;
  repairs: number;
}

const COLORS = [
  "var(--chart-3)",
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-5)",
];

const LABELS = ["Fuel", "Maintenance", "Improvements", "Repairs"];

export function ExpenseDonutChart({
  fuel,
  maintenance,
  improvements,
  repairs,
}: ExpenseDonutChartProps) {
  const data = [
    { name: "Fuel", value: fuel },
    { name: "Maintenance", value: maintenance },
    { name: "Improvements", value: improvements },
    { name: "Repairs", value: repairs },
  ].filter((d) => d.value > 0);

  const total = fuel + maintenance + improvements + repairs;

  if (total === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        No expense data yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
      <div className="relative h-40 w-40 shrink-0 sm:h-44 sm:w-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="90%"
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((_, idx) => (
                <Cell
                  key={`cell-${idx}`}
                  fill={COLORS[LABELS.indexOf(data[idx].name)] ?? COLORS[0]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                borderColor: "var(--border)",
                borderRadius: "0.5rem",
                color: "var(--card-foreground)",
                fontSize: "12px",
              }}
              formatter={(value: number) => formatCurrency(value)}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Total
          </span>
          <span className="text-sm font-bold text-card-foreground">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:flex sm:flex-col sm:gap-2.5">
        {[
          { label: "Fuel", value: fuel, color: COLORS[0] },
          { label: "Maintenance", value: maintenance, color: COLORS[1] },
          { label: "Improvements", value: improvements, color: COLORS[2] },
          { label: "Repairs", value: repairs, color: COLORS[3] },
        ]
          .filter((d) => d.value > 0)
          .map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">
                  {item.label}
                </span>
                <span className="text-xs font-semibold text-card-foreground">
                  {formatCurrency(item.value)}
                  <span className="ml-1 font-normal text-muted-foreground">
                    ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)
                  </span>
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
