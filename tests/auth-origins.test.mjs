import assert from "node:assert/strict";
import test from "node:test";
import { getBetterAuthTrustedOrigins } from "../lib/auth/auth-origins.ts";

test("localhost base URL trusts both localhost and 127.0.0.1 in local development", () => {
  const origins = getBetterAuthTrustedOrigins("http://localhost:3000");

  assert.deepEqual(origins.sort(), [
    "http://127.0.0.1:3000",
    "http://localhost:3000",
  ]);
});

test("127.0.0.1 base URL trusts both 127.0.0.1 and localhost in local development", () => {
  const origins = getBetterAuthTrustedOrigins("http://127.0.0.1:3000");

  assert.deepEqual(origins.sort(), [
    "http://127.0.0.1:3000",
    "http://localhost:3000",
  ]);
});
