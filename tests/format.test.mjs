import assert from "node:assert/strict";
import test from "node:test";
import {
  formatDate,
  formatDateRelative,
  getLocalDateInputValue,
} from "../lib/format.ts";

function toDateOnly(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

test("formatDate handles both date-only and ISO timestamp strings", () => {
  assert.equal(formatDate("2026-03-18"), formatDate("2026-03-18T12:00:00.000Z"));
});

test("formatDateRelative handles both date-only and ISO timestamp strings", () => {
  const dateOnly = formatDateRelative("2026-03-18");
  const isoTimestamp = formatDateRelative("2026-03-18T12:00:00.000Z");

  assert.equal(isoTimestamp, dateOnly);
  assert.notEqual(isoTimestamp, "Invalid Date");
});

test("formatDateRelative treats today's date-only value as Today", () => {
  assert.equal(formatDateRelative(toDateOnly(new Date())), "Today");
});

test("formatDateRelative treats yesterday's date-only value as Yesterday", () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  assert.equal(formatDateRelative(toDateOnly(yesterday)), "Yesterday");
});

test("formatDateRelative formats future dates as absolute dates", () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = toDateOnly(tomorrow);

  assert.equal(formatDateRelative(tomorrowDate), formatDate(tomorrowDate));
  assert.notEqual(formatDateRelative(tomorrowDate), "Today");
});

test("getLocalDateInputValue uses local calendar parts", () => {
  const date = new Date(2026, 2, 17, 23, 45, 0);
  assert.equal(getLocalDateInputValue(date), "2026-03-17");
});
