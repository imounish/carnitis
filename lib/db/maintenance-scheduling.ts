import type {
  MaintenanceItemStatus,
  MaintenanceScheduleItem,
} from "./schema.js";
import {
  addMonthsToIsoDateClamped,
  getTodayLocalDateString,
  parseIsoDateToLocalDate,
  type LocalDateString,
} from "../time.js";

const DAY_IN_MS = 1000 * 60 * 60 * 24;
const DATE_DUE_SOON_DAYS = 30;
const MIN_MILES_DUE_SOON = 1000;

const maintenanceStatusOrder: Record<MaintenanceItemStatus, number> = {
  overdue: 0,
  due_soon: 1,
  upcoming: 2,
  completed: 3,
};

export interface MaintenanceSchedulingInput {
  interval_miles: number;
  interval_months: number | null;
  last_done_mileage: number | null;
  last_done_date: LocalDateString | null;
}

interface MaintenanceSchedulingContext {
  currentMileage: number;
  today?: LocalDateString;
}

interface MaintenanceStatusInput {
  interval_miles: number;
  currentMileage: number;
  next_due_mileage: number | null;
  next_due_date: LocalDateString | null;
  today?: LocalDateString;
}

type MaintenanceSortable = Pick<
  MaintenanceScheduleItem,
  "name" | "next_due_date" | "next_due_mileage" | "updated_at" | "status"
>;

function getDaysUntilDue(
  nextDueDate: LocalDateString,
  today: LocalDateString
) {
  const dueDate = parseIsoDateToLocalDate(nextDueDate);
  const todayDate = parseIsoDateToLocalDate(today);
  return Math.floor((dueDate.getTime() - todayDate.getTime()) / DAY_IN_MS);
}

function compareNullableNumbersAscending(
  left: number | null,
  right: number | null
) {
  if (left == null && right == null) {
    return 0;
  }

  if (left == null) {
    return 1;
  }

  if (right == null) {
    return -1;
  }

  return left - right;
}

function compareNullableDatesAscending(
  left: LocalDateString | null,
  right: LocalDateString | null
) {
  if (left == null && right == null) {
    return 0;
  }

  if (left == null) {
    return 1;
  }

  if (right == null) {
    return -1;
  }

  return left.localeCompare(right);
}

export function calculateNextDueFields(
  input: MaintenanceSchedulingInput,
  context: MaintenanceSchedulingContext
) {
  const today = context.today ?? getTodayLocalDateString();
  const mileageBaseline = input.last_done_mileage ?? context.currentMileage;
  const dateBaseline = input.last_done_date ?? today;

  return {
    next_due_mileage: mileageBaseline + input.interval_miles,
    next_due_date: input.interval_months
      ? addMonthsToIsoDateClamped(dateBaseline, input.interval_months)
      : null,
  };
}

export function deriveMaintenanceStatus(
  input: MaintenanceStatusInput
): Exclude<MaintenanceItemStatus, "completed"> {
  const today = input.today ?? getTodayLocalDateString();

  if (
    input.next_due_mileage != null &&
    input.currentMileage >= input.next_due_mileage
  ) {
    return "overdue";
  }

  if (input.next_due_date && today > input.next_due_date) {
    return "overdue";
  }

  const mileageRemaining =
    input.next_due_mileage == null
      ? null
      : input.next_due_mileage - input.currentMileage;
  const dueSoonMileageThreshold = Math.max(
    MIN_MILES_DUE_SOON,
    input.interval_miles * 0.25
  );

  if (
    mileageRemaining != null &&
    mileageRemaining >= 0 &&
    mileageRemaining <= dueSoonMileageThreshold
  ) {
    return "due_soon";
  }

  if (input.next_due_date) {
    const daysUntilDue = getDaysUntilDue(input.next_due_date, today);
    if (daysUntilDue >= 0 && daysUntilDue <= DATE_DUE_SOON_DAYS) {
      return "due_soon";
    }
  }

  return "upcoming";
}

export function applyDerivedMaintenanceState<T extends MaintenanceScheduleItem>(
  item: T,
  currentMileage: number,
  today?: LocalDateString
): T {
  return {
    ...item,
    status: deriveMaintenanceStatus({
      interval_miles: item.interval_miles,
      currentMileage,
      next_due_mileage: item.next_due_mileage,
      next_due_date: item.next_due_date,
      today,
    }),
  };
}

export function compareMaintenanceItems(
  left: MaintenanceSortable,
  right: MaintenanceSortable
) {
  if (maintenanceStatusOrder[left.status] !== maintenanceStatusOrder[right.status]) {
    return maintenanceStatusOrder[left.status] - maintenanceStatusOrder[right.status];
  }

  const byDate = compareNullableDatesAscending(
    left.next_due_date,
    right.next_due_date
  );
  if (byDate !== 0) {
    return byDate;
  }

  const byMileage = compareNullableNumbersAscending(
    left.next_due_mileage,
    right.next_due_mileage
  );
  if (byMileage !== 0) {
    return byMileage;
  }

  return left.name.localeCompare(right.name);
}
