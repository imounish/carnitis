import assert from "node:assert/strict";
import test from "node:test";
import { parseClientEnv, parseServerEnv } from "../lib/env.ts";

test("client env accepts the publishable key contract", () => {
  const env = parseClientEnv({
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  });

  assert.equal(
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    "sb_publishable_test"
  );
});

test("client env rejects the legacy anon key name", () => {
  assert.throws(
    () =>
      parseClientEnv({
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "legacy_anon_key",
      }),
    /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/
  );
});

test("server env requires the secret key contract", () => {
  const env = parseServerEnv({
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
    SUPABASE_SECRET_KEY: "sb_secret_test",
    DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
    BETTER_AUTH_URL: "http://127.0.0.1:3000",
    BETTER_AUTH_SECRET: "12345678901234567890123456789012",
  });

  assert.equal(env.SUPABASE_SECRET_KEY, "sb_secret_test");
});
