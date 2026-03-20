import assert from "node:assert/strict";
import test from "node:test";
import {
  getInvalidEntriesPayloadErrorPayload,
  getUnauthorizedEntriesErrorPayload,
} from "../lib/db/entries-api-payloads.ts";

test("exposes a typed unauthorized payload for entry mutations", () => {
  assert.deepEqual(getUnauthorizedEntriesErrorPayload(), {
    status: 401,
    body: {
      error: {
        code: "unauthorized",
        message: "You need to sign in first.",
      },
    },
  });
});

test("exposes a typed invalid-payload response for entry mutations", () => {
  assert.deepEqual(getInvalidEntriesPayloadErrorPayload(), {
    status: 400,
    body: {
      error: {
        code: "validation",
        message: "Invalid entry payload.",
      },
    },
  });
});
