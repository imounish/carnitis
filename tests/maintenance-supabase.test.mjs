import assert from "node:assert/strict";
import test from "node:test";
import { Pool } from "pg";
import { cleanupOwnedTestData, loadLocalEnv } from "./helpers/local-env.mjs";

function toIsoDate(value) {
  if (!value) {
    return value;
  }

  return new Date(value).toISOString().slice(0, 10);
}

test(
  "maintenance rows persist computed schedule fields and stay owner-scoped in local Supabase",
  { skip: !loadLocalEnv() },
  async (t) => {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const userA = `maintenance-user-a-${suffix}`;
    const userB = `maintenance-user-b-${suffix}`;
    const emailA = `maintenance-a-${suffix}@example.com`;
    const emailB = `maintenance-b-${suffix}@example.com`;
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
            ($1, 'Maintenance User A', $2, true, timezone('utc', now()), timezone('utc', now())),
            ($3, 'Maintenance User B', $4, true, timezone('utc', now()), timezone('utc', now()))
        `,
        [userA, emailA, userB, emailB]
      );

      const [carAResult, carBResult] = await Promise.all([
        pool.query(
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
            values ($1, 'Car A', 'Toyota', 'Camry', 2024, 12000, 'gasoline')
            returning id
          `,
          [userA]
        ),
        pool.query(
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
            values ($1, 'Car B', 'Honda', 'Civic', 2023, 5000, 'gasoline')
            returning id
          `,
          [userB]
        ),
      ]);

      const carAId = carAResult.rows[0].id;
      const carBId = carBResult.rows[0].id;
      const created = await pool.query(
        `
          insert into public.maintenance_schedule_items (
            owner_user_id,
            car_id,
            name,
            description,
            interval_miles,
            interval_months,
            last_done_mileage,
            last_done_date,
            next_due_mileage,
            next_due_date,
            status,
            estimated_cost,
            notes
          )
          values (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
          )
          returning id, next_due_mileage, next_due_date, status
        `,
        [
          userA,
          carAId,
          "Oil Change",
          null,
          5000,
          6,
          10000,
          "2026-01-15",
          15000,
          "2026-07-15",
          "upcoming",
          89.99,
          null,
        ]
      );

      assert.equal(Number(created.rows[0].next_due_mileage), 15000);
      assert.equal(toIsoDate(created.rows[0].next_due_date), "2026-07-15");
      assert.equal(created.rows[0].status, "upcoming");

      await pool.query(
        `
          insert into public.maintenance_schedule_items (
            owner_user_id,
            car_id,
            name,
            interval_miles,
            next_due_mileage,
            status
          )
          values
            ($1, $2, 'Brake Inspection', 5000, 11500, 'upcoming'),
            ($1, $2, 'Tire Rotation', 5000, 12800, 'upcoming'),
            ($3, $4, 'Foreign Item', 5000, 5100, 'upcoming')
        `,
        [userA, carAId, userB, carBId]
      );

      const foreignUpdate = await pool.query(
        `
          update public.maintenance_schedule_items
          set
            interval_miles = $3,
            last_done_mileage = $4,
            last_done_date = $5,
            next_due_mileage = $6,
            next_due_date = $7,
            status = $8
          where id = $1 and owner_user_id = $2
          returning id
        `,
        [
          created.rows[0].id,
          userB,
          6000,
          11800,
          "2026-03-18",
          17800,
          "2026-09-18",
          "upcoming",
        ]
      );
      assert.equal(foreignUpdate.rowCount, 0);

      const ownerUpdate = await pool.query(
        `
          update public.maintenance_schedule_items
          set
            interval_miles = $3,
            last_done_mileage = $4,
            last_done_date = $5,
            next_due_mileage = $6,
            next_due_date = $7,
            status = $8
          where id = $1 and owner_user_id = $2
          returning interval_miles, next_due_mileage, next_due_date, status
        `,
        [
          created.rows[0].id,
          userA,
          6000,
          11800,
          "2026-03-18",
          17800,
          "2026-09-18",
          "upcoming",
        ]
      );

      assert.equal(ownerUpdate.rowCount, 1);
      assert.equal(Number(ownerUpdate.rows[0].interval_miles), 6000);
      assert.equal(Number(ownerUpdate.rows[0].next_due_mileage), 17800);
      assert.equal(toIsoDate(ownerUpdate.rows[0].next_due_date), "2026-09-18");
      assert.equal(ownerUpdate.rows[0].status, "upcoming");

      const foreignDelete = await pool.query(
        `
          delete from public.maintenance_schedule_items
          where id = $1 and owner_user_id = $2
          returning id
        `,
        [created.rows[0].id, userB]
      );
      assert.equal(foreignDelete.rowCount, 0);

      const ownerDelete = await pool.query(
        `
          delete from public.maintenance_schedule_items
          where id = $1 and owner_user_id = $2
          returning id
        `,
        [created.rows[0].id, userA]
      );
      assert.equal(ownerDelete.rowCount, 1);
    } finally {
      if (canReachDatabase) {
        await cleanupOwnedTestData(pool, userA, userB);
      }

      await pool.end();
    }
  }
);
