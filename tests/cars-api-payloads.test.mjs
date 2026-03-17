import assert from "node:assert/strict";
import test from "node:test";
import {
  getCarNotFoundErrorPayload,
  getEmptyCarsUpdatePayloadErrorPayload,
} from "../lib/db/cars-api-payloads.ts";

test("exposes a typed empty-update response payload for the cars routes", () => {
  assert.deepEqual(getEmptyCarsUpdatePayloadErrorPayload(), {
    status: 400,
    body: {
      error: {
        code: "validation",
        message: "At least one car field must be provided.",
      },
    },
  });
});

test("exposes a typed not-found response payload for scoped car mutations", () => {
  assert.deepEqual(getCarNotFoundErrorPayload(), {
    status: 404,
    body: {
      error: {
        code: "not_found",
        message: "That car could not be found.",
      },
    },
  });
});
