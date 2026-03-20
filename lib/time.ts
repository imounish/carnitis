const DAY_IN_MS = 1000 * 60 * 60 * 24;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export type LocalDateString = string;
export type IsoTimestampString = string;

function getLocalDateParts(date: Date) {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

function padNumber(value: number) {
  return String(value).padStart(2, "0");
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getDaysInMonth(year: number, monthOneIndexed: number) {
  return new Date(year, monthOneIndexed, 0).getDate();
}

function parseTimestamp(value: string) {
  const timestamp = new Date(value);
  return Number.isNaN(timestamp.getTime()) ? null : timestamp;
}

function parseTemporalValue(value: string) {
  if (isIsoDateString(value)) {
    return parseIsoDateToLocalDate(value);
  }

  return parseTimestamp(value);
}

export function isIsoDateString(value: string): value is LocalDateString {
  return ISO_DATE_REGEX.test(value);
}

export function parseIsoDateToLocalDate(value: LocalDateString) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function getTodayLocalDateString(date = new Date()): LocalDateString {
  const { year, month, day } = getLocalDateParts(date);
  return `${year}-${padNumber(month)}-${padNumber(day)}`;
}

export function addMonthsToIsoDateClamped(
  value: LocalDateString,
  months: number
): LocalDateString {
  const [rawYear, rawMonth, rawDay] = value.split("-").map(Number);
  const monthIndex = rawMonth - 1 + months;
  const nextYear = rawYear + Math.floor(monthIndex / 12);
  const nextMonthIndex = ((monthIndex % 12) + 12) % 12;
  const nextMonth = nextMonthIndex + 1;
  const nextDay = Math.min(rawDay, getDaysInMonth(nextYear, nextMonth));

  return `${nextYear}-${padNumber(nextMonth)}-${padNumber(nextDay)}`;
}

export function compareIsoDateStringsDesc(
  left: LocalDateString,
  right: LocalDateString
) {
  return right.localeCompare(left);
}

export function formatLocalDate(value: string): string {
  const parsed = parseTemporalValue(value);
  if (!parsed) {
    return value;
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatLocalDateTime(
  value: IsoTimestampString,
  options?: {
    locale?: string;
    timeZone?: string;
    includeSeconds?: boolean;
  }
) {
  const parsed = parseTimestamp(value);
  if (!parsed) {
    return value;
  }

  return new Intl.DateTimeFormat(options?.locale ?? "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: options?.includeSeconds ? "2-digit" : undefined,
    timeZone: options?.timeZone,
  }).format(parsed);
}

export function formatRelativeDate(
  value: string,
  options?: {
    now?: Date;
  }
) {
  const parsed = parseTemporalValue(value);
  if (!parsed) {
    return value;
  }

  const now = startOfLocalDay(options?.now ?? new Date());
  const valueDay = startOfLocalDay(parsed);
  const diff = Math.floor((now.getTime() - valueDay.getTime()) / DAY_IN_MS);

  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 0) return formatLocalDate(value);
  if (diff < 7) return `${diff} days ago`;
  if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
  return formatLocalDate(value);
}
