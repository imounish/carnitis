import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { Pool } from "pg";

function loadLocalEnv() {
  if (process.env.DATABASE_URL) {
    return true;
  }

  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    return false;
  }

  const contents = fs.readFileSync(envPath, "utf8");
  for (const rawLine of contents.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }

  return Boolean(process.env.DATABASE_URL);
}

test(
  "domain schema enforces Better Auth ownership boundaries in local Supabase",
  { skip: !loadLocalEnv() },
  async (t) => {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const userA = `test-user-a-${suffix}`;
    const userB = `test-user-b-${suffix}`;
    const emailA = `a-${suffix}@example.com`;
    const emailB = `b-${suffix}@example.com`;
    let canReachDatabase = false;

    try {
      try {
        await pool.query("select 1");
        canReachDatabase = true;
      } catch (error) {
        const code = error && typeof error === "object" ? error.code : undefined;
        if (code === "EPERM" || code === "ECONNREFUSED") {
          t.skip("Local Supabase is not reachable from this environment.");
          return;
        }
        throw error;
      }

      await pool.query(
        `
          insert into public."user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
          values
            ($1, 'Test User A', $2, true, timezone('utc', now()), timezone('utc', now())),
            ($3, 'Test User B', $4, true, timezone('utc', now()), timezone('utc', now()))
        `,
        [userA, emailA, userB, emailB]
      );

      const carResult = await pool.query(
        `
          insert into public.cars (
            owner_user_id,
            name,
            make,
            model,
            year,
            current_mileage,
            fuel_type
          )
          values ($1, 'Scoped Car', 'Toyota', 'Camry', 2024, 100, 'gasoline')
          returning id
        `,
        [userA]
      );

      const carId = carResult.rows[0].id;

      await assert.rejects(
        () =>
          pool.query(
            `
              insert into public.todo_items (
                owner_user_id,
                car_id,
                title,
                priority,
                status
              )
              values ($1, $2, 'Cross-user todo', 'medium', 'pending')
            `,
            [userB, carId]
          ),
        /foreign key/i
      );

      const client = await pool.connect();
      try {
        await client.query("begin");
        await client.query("select set_config('app.current_user_id', $1, true)", [
          userA,
        ]);
        const scopedUserResult = await client.query(
          "select app.current_user_id() as current_user_id"
        );
        await client.query("rollback");

        assert.equal(scopedUserResult.rows[0].current_user_id, userA);
      } finally {
        client.release();
      }
    } finally {
      if (canReachDatabase) {
        await pool.query(
          `
            delete from public.entries where owner_user_id in ($1, $2);
            delete from public.todo_items where owner_user_id in ($1, $2);
            delete from public.maintenance_schedule_items where owner_user_id in ($1, $2);
            delete from public.cars where owner_user_id in ($1, $2);
            delete from public.user_profiles where user_id in ($1, $2);
            delete from public."user" where id in ($1, $2);
          `,
          [userA, userB]
        );
      }

      await pool.end();
    }
  }
);

test(
  "car update and delete stay owner-scoped and delete cascades to related rows in local Supabase",
  { skip: !loadLocalEnv() },
  async (t) => {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const userA = `test-user-update-a-${suffix}`;
    const userB = `test-user-update-b-${suffix}`;
    const emailA = `update-a-${suffix}@example.com`;
    const emailB = `update-b-${suffix}@example.com`;
    let canReachDatabase = false;

    try {
      try {
        await pool.query("select 1");
        canReachDatabase = true;
      } catch (error) {
        const code = error && typeof error === "object" ? error.code : undefined;
        if (code === "EPERM" || code === "ECONNREFUSED") {
          t.skip("Local Supabase is not reachable from this environment.");
          return;
        }
        throw error;
      }

      await pool.query(
        `
          insert into public."user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
          values
            ($1, 'Update User A', $2, true, timezone('utc', now()), timezone('utc', now())),
            ($3, 'Update User B', $4, true, timezone('utc', now()), timezone('utc', now()))
        `,
        [userA, emailA, userB, emailB]
      );

      const carResult = await pool.query(
        `
          insert into public.cars (
            owner_user_id,
            name,
            make,
            model,
            year,
            current_mileage,
            fuel_type
          )
          values ($1, 'Scoped Car', 'Toyota', 'Camry', 2024, 100, 'gasoline')
          returning id
        `,
        [userA]
      );

      const carId = carResult.rows[0].id;

      const ownerUpdate = await pool.query(
        `
          update public.cars
          set name = 'Updated Scoped Car'
          where id = $1 and owner_user_id = $2
          returning name
        `,
        [carId, userA]
      );

      assert.equal(ownerUpdate.rowCount, 1);
      assert.equal(ownerUpdate.rows[0].name, "Updated Scoped Car");

      const foreignUpdate = await pool.query(
        `
          update public.cars
          set name = 'Cross User Edit'
          where id = $1 and owner_user_id = $2
          returning id
        `,
        [carId, userB]
      );

      assert.equal(foreignUpdate.rowCount, 0);

      await pool.query(
        `
          insert into public.maintenance_schedule_items (
            owner_user_id,
            car_id,
            name,
            interval_miles,
            status
          )
          values ($1, $2, 'Oil Change', 5000, 'upcoming')
        `,
        [userA, carId]
      );

      await pool.query(
        `
          insert into public.todo_items (
            owner_user_id,
            car_id,
            title,
            priority,
            status
          )
          values ($1, $2, 'Replace wipers', 'medium', 'pending')
        `,
        [userA, carId]
      );

      await pool.query(
        `
          insert into public.entries (
            owner_user_id,
            car_id,
            entry_type,
            date,
            mileage
          )
          values ($1, $2, 'fuel', current_date, 150)
        `,
        [userA, carId]
      );

      const foreignDelete = await pool.query(
        `
          delete from public.cars
          where id = $1 and owner_user_id = $2
          returning id
        `,
        [carId, userB]
      );

      assert.equal(foreignDelete.rowCount, 0);

      const ownerDelete = await pool.query(
        `
          delete from public.cars
          where id = $1 and owner_user_id = $2
          returning id
        `,
        [carId, userA]
      );

      assert.equal(ownerDelete.rowCount, 1);

      const [carsCount, entriesCount, maintenanceCount, todosCount] =
        await Promise.all([
          pool.query("select count(*)::int as count from public.cars where id = $1", [
            carId,
          ]),
          pool.query(
            "select count(*)::int as count from public.entries where owner_user_id = $1 and car_id = $2",
            [userA, carId]
          ),
          pool.query(
            "select count(*)::int as count from public.maintenance_schedule_items where owner_user_id = $1 and car_id = $2",
            [userA, carId]
          ),
          pool.query(
            "select count(*)::int as count from public.todo_items where owner_user_id = $1 and car_id = $2",
            [userA, carId]
          ),
        ]);

      assert.equal(carsCount.rows[0].count, 0);
      assert.equal(entriesCount.rows[0].count, 0);
      assert.equal(maintenanceCount.rows[0].count, 0);
      assert.equal(todosCount.rows[0].count, 0);
    } finally {
      if (canReachDatabase) {
        await pool.query(
          `
            delete from public.entries where owner_user_id in ($1, $2);
            delete from public.todo_items where owner_user_id in ($1, $2);
            delete from public.maintenance_schedule_items where owner_user_id in ($1, $2);
            delete from public.cars where owner_user_id in ($1, $2);
            delete from public.user_profiles where user_id in ($1, $2);
            delete from public."user" where id in ($1, $2);
          `,
          [userA, userB]
        );
      }

      await pool.end();
    }
  }
);
