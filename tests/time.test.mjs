import assert from "node:assert/strict";
import test from "node:test";
import {
  addMonthsToIsoDateClamped,
  compareIsoDateStringsDesc,
  formatLocalDateTime,
  formatRelativeDate,
  getTodayLocalDateString,
  parseIsoDateToLocalDate,
} from "../lib/time.ts";

test("parseIsoDateToLocalDate preserves the local calendar day", () => {
  const parsed = parseIsoDateToLocalDate("2026-03-18");

  assert.equal(parsed.getFullYear(), 2026);
  assert.equal(parsed.getMonth(), 2);
  assert.equal(parsed.getDate(), 18);
});

test("getTodayLocalDateString uses local calendar parts", () => {
  const date = new Date(2026, 2, 17, 23, 45, 0);
  assert.equal(getTodayLocalDateString(date), "2026-03-17");
});

test("addMonthsToIsoDateClamped clamps end-of-month dates", () => {
  assert.equal(addMonthsToIsoDateClamped("2026-01-31", 1), "2026-02-28");
  assert.equal(addMonthsToIsoDateClamped("2024-01-31", 1), "2024-02-29");
  assert.equal(addMonthsToIsoDateClamped("2026-08-31", 6), "2027-02-28");
});

test("compareIsoDateStringsDesc sorts newest dates first", () => {
  const dates = ["2026-03-18", "2026-03-01", "2026-03-17"];
  dates.sort(compareIsoDateStringsDesc);

  assert.deepEqual(dates, ["2026-03-18", "2026-03-17", "2026-03-01"]);
});

test("formatRelativeDate accepts an explicit current date for deterministic output", () => {
  const now = new Date(2026, 2, 18, 10, 0, 0);

  assert.equal(formatRelativeDate("2026-03-18", { now }), "Today");
  assert.equal(formatRelativeDate("2026-03-17", { now }), "Yesterday");
});

test("formatLocalDateTime honors an explicit target timezone", () => {
  const formatted = formatLocalDateTime("2026-03-18T02:30:00.000Z", {
    timeZone: "America/New_York",
  });

  assert.match(formatted, /Mar 17, 2026/);
  assert.match(formatted, /10:30 PM/);
});
