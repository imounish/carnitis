const DAY_IN_MS = 1000 * 60 * 60 * 24;

function isDateOnlyString(dateStr: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

function parseDateInput(dateStr: string) {
  if (isDateOnlyString(dateStr)) {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  return new Date(dateStr);
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getLocalDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
  const d = parseDateInput(dateStr);
  if (Number.isNaN(d.getTime())) {
    return dateStr;
  }

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateRelative(dateStr: string): string {
  const d = parseDateInput(dateStr);
  if (Number.isNaN(d.getTime())) {
    return dateStr;
  }

  const today = startOfLocalDay(new Date());
  const valueDay = startOfLocalDay(d);
  const diff = Math.floor((today.getTime() - valueDay.getTime()) / DAY_IN_MS);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 0) return formatDate(dateStr);
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
