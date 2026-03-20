import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import {
  DataAccessError,
  getUserSafeErrorMessage,
  normalizeDataAccessError,
} from "../lib/db/errors.ts";

test("normalizes zod validation failures into data access errors", () => {
  const schema = z.object({
    mileage: z.number().min(0),
  });

  const result = normalizeDataAccessError(schema.safeParse({ mileage: -1 }).error);

  assert.equal(result.code, "validation");
  assert.match(result.message, /mileage/i);
});

test("normalizes postgres unique violations into conflict errors", () => {
  const result = normalizeDataAccessError({
    code: "23505",
    message: "duplicate key value violates unique constraint",
  });

  assert.equal(result.code, "conflict");
  assert.equal(getUserSafeErrorMessage(result), "A record with that value already exists.");
});

test("preserves explicit data access errors", () => {
  const original = new DataAccessError("forbidden", "No access.");
  const result = normalizeDataAccessError(original);

  assert.equal(result, original);
});

test("normalizes data-access-like workflow errors into data access errors", () => {
  const result = normalizeDataAccessError({
    code: "not_found",
    status: 404,
    message: "That car could not be found.",
  });

  assert.equal(result.code, "not_found");
  assert.equal(result.status, 404);
  assert.equal(result.message, "That car could not be found.");
});
