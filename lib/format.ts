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
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateRelative(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr + "T00:00:00");
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
  return formatDate(dateStr);
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
