import assert from "node:assert/strict";
import test from "node:test";
import nextConfig from "../next.config.mjs";

test("next config does not ignore build errors", () => {
  assert.equal(nextConfig.typescript?.ignoreBuildErrors, undefined);
});

test("next config applies security headers to every route", async () => {
  const [rule] = await nextConfig.headers();
  const keys = rule.headers.map((header) => header.key);

  assert.equal(rule.source, "/:path*");
  for (const key of [
    "Content-Security-Policy-Report-Only",
    "Strict-Transport-Security",
    "X-Frame-Options",
    "X-Content-Type-Options",
    "Referrer-Policy",
  ]) {
    assert.ok(keys.includes(key), `missing ${key}`);
  }
});

test("a migration enables RLS on every Better Auth table", async () => {
  const { readdirSync, readFileSync } = await import("node:fs");
  const sql = readdirSync("supabase/migrations")
    .map((file) => readFileSync(`supabase/migrations/${file}`, "utf8"))
    .join("\n");

  for (const table of ["user", "session", "account", "verification"]) {
    assert.match(sql, new RegExp(`alter table if exists public\\."${table}" enable row level security`));
  }
});
