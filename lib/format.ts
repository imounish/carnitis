import {
  formatLocalDate,
  formatRelativeDate,
  getTodayLocalDateString,
} from "./time.js";

export function getLocalDateInputValue(date = new Date()) {
  return getTodayLocalDateString(date);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function formatMileage(miles: number): string {
  return `${new Intl.NumberFormat("en-US").format(Math.round(miles))} mi`;
}

export function formatDate(dateStr: string): string {
  return formatLocalDate(dateStr);
}

export function formatDateRelative(dateStr: string): string {
  return formatRelativeDate(dateStr);
}

export function getCategoryLabel(cat: string): string {
  const map: Record<string, string> = {
    fuel: "Fuel",
    preventive_maintenance: "Preventive",
    regular_maintenance: "Maintenance",
    improvements: "Improvement",
    repairs: "Repair",
  };
  return map[cat] ?? cat;
}

export function getEntryTypeLabel(type: string): string {
  const map: Record<string, string> = {
    fuel: "Fuel",
    maintenance_expense: "Maintenance Expense",
    maintenance_done: "Maintenance Done",
  };
  return map[type] ?? type;
}

export function getPriorityLabel(priority: string): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    upcoming: "Upcoming",
    due_soon: "Due Soon",
    overdue: "Overdue",
    completed: "Completed",
    pending: "Pending",
    in_progress: "In Progress",
    cancelled: "Cancelled",
  };
  return map[status] ?? status;
}
