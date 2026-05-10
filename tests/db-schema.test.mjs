import assert from "node:assert/strict";
import test from "node:test";
import { Pool } from "pg";
import { loadLocalEnv } from "./helpers/local-env.mjs";

test(
  "local cars schema has mileage tracking columns required by dashboard joins",
  { skip: !loadLocalEnv() },
  async (t) => {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    try {
      try {
        await pool.query("select 1");
      } catch (error) {
        const code =
          error && typeof error === "object" ? error.code : undefined;
        if (code === "EPERM" || code === "ECONNREFUSED") {
          t.skip("Local Supabase is not reachable from this environment.");
          return;
        }
        throw error;
      }

      const result = await pool.query(
        `
          select column_name, data_type, is_nullable, column_default
          from information_schema.columns
          where table_schema = 'public'
            and table_name = 'cars'
            and column_name = any($1::text[])
        `,
        [["mileage_as_of_date", "mileage_check_interval_days"]]
      );

      const columns = new Map(
        result.rows.map((row) => [row.column_name, row])
      );

      assert.equal(columns.get("mileage_as_of_date")?.data_type, "date");
      assert.equal(columns.get("mileage_as_of_date")?.is_nullable, "NO");
      assert.equal(
        columns.get("mileage_as_of_date")?.column_default,
        "CURRENT_DATE"
      );
      assert.equal(
        columns.get("mileage_check_interval_days")?.data_type,
        "integer"
      );
      assert.equal(
        columns.get("mileage_check_interval_days")?.is_nullable,
        "NO"
      );
      assert.equal(
        columns.get("mileage_check_interval_days")?.column_default,
        "14"
      );
    } finally {
      await pool.end();
    }
  }
);
