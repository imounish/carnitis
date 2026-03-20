import assert from "node:assert/strict";
import test from "node:test";
import { Pool } from "pg";
import { listEntriesByCarIdQuery } from "../lib/db/supabase/entry-queries.ts";
import { createEntryWorkflow } from "../lib/db/supabase/entry-workflow.ts";
import { cleanupOwnedTestData, loadLocalEnv } from "./helpers/local-env.mjs";

function toIsoDate(value) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).slice(0, 10);
}

test(
  "listEntriesByCarIdQuery returns only owned entries ordered by date and created time",
  { skip: !loadLocalEnv() },
  async (t) => {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const userA = `entries-read-a-${suffix}`;
    const userB = `entries-read-b-${suffix}`;
    const emailA = `entries-read-a-${suffix}@example.com`;
    const emailB = `entries-read-b-${suffix}@example.com`;
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
            ($1, 'Entries Read A', $2, true, timezone('utc', now()), timezone('utc', now())),
            ($3, 'Entries Read B', $4, true, timezone('utc', now()), timezone('utc', now()))
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
          values ($1, 'Read Car', 'Toyota', 'Camry', 2024, 100, 'gasoline')
          returning id
        `,
        [userA]
      );

      const foreignCarResult = await pool.query(
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
          values ($1, 'Foreign Car', 'Honda', 'Civic', 2022, 90, 'gasoline')
          returning id
        `,
        [userB]
      );

      const carId = carResult.rows[0].id;
      const foreignCarId = foreignCarResult.rows[0].id;

      await pool.query(
        `
          insert into public.entries (
            owner_user_id,
            car_id,
            entry_type,
            date,
            mileage,
            fuel_gallons,
            fuel_price_per_gallon,
            fuel_total_cost,
            fuel_station,
            was_full_tank,
            expense_category,
            expense_amount,
            description,
            created_at,
            updated_at
          )
          values
            ($1, $2, 'fuel', '2026-03-18', 120, 10, 3.50, 35.00, 'Station A', true, 'fuel', 35.00, 'Fuel A', '2026-03-18T08:00:00.000Z', '2026-03-18T08:00:00.000Z'),
            ($1, $2, 'maintenance_expense', '2026-03-18', 121, null, null, null, null, null, 'regular_maintenance', 50.00, 'Service same day', '2026-03-18T12:00:00.000Z', '2026-03-18T12:00:00.000Z'),
            ($1, $2, 'fuel', '2026-03-10', 100, 9, 3.40, 30.60, 'Station B', true, 'fuel', 30.60, 'Fuel B', '2026-03-10T09:00:00.000Z', '2026-03-10T09:00:00.000Z'),
            ($3, $4, 'fuel', '2026-03-20', 95, 8, 3.20, 25.60, 'Foreign', true, 'fuel', 25.60, 'Foreign fuel', '2026-03-20T10:00:00.000Z', '2026-03-20T10:00:00.000Z')
        `,
        [userA, carId, userB, foreignCarId]
      );

      const entries = await listEntriesByCarIdQuery({
        db: pool,
        userId: userA,
        carId,
      });
      const fuelEntries = await listEntriesByCarIdQuery({
        db: pool,
        userId: userA,
        carId,
        entryType: "fuel",
      });
      const foreignEntries = await listEntriesByCarIdQuery({
        db: pool,
        userId: userA,
        carId: foreignCarId,
      });

      assert.deepEqual(
        entries.map((entry) => entry.description),
        ["Service same day", "Fuel A", "Fuel B"]
      );
      assert.deepEqual(
        fuelEntries.map((entry) => entry.description),
        ["Fuel A", "Fuel B"]
      );
      assert.equal(foreignEntries.length, 0);
    } finally {
      if (canReachDatabase) {
        await cleanupOwnedTestData(pool, userA, userB);
      }

      await pool.end();
    }
  }
);

test(
  "createEntryWorkflow updates cars, linked maintenance/todos, and rolls back on invalid linkage",
  { skip: !loadLocalEnv() },
  async (t) => {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const userA = `entries-write-a-${suffix}`;
    const userB = `entries-write-b-${suffix}`;
    const emailA = `entries-write-a-${suffix}@example.com`;
    const emailB = `entries-write-b-${suffix}@example.com`;
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
            ($1, 'Entries Write A', $2, true, timezone('utc', now()), timezone('utc', now())),
            ($3, 'Entries Write B', $4, true, timezone('utc', now()), timezone('utc', now()))
        `,
        [userA, emailA, userB, emailB]
      );

      const [{ rows: carRows }, { rows: foreignCarRows }] = await Promise.all([
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
            values ($1, 'Workflow Car', 'Toyota', 'Camry', 2024, 100, 'gasoline')
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
            values ($1, 'Foreign Workflow Car', 'Honda', 'Civic', 2023, 90, 'gasoline')
            returning id
          `,
          [userB]
        ),
      ]);

      const carId = carRows[0].id;
      const foreignCarId = foreignCarRows[0].id;

      const maintenanceResult = await pool.query(
        `
          insert into public.maintenance_schedule_items (
            owner_user_id,
            car_id,
            name,
            interval_miles,
            interval_months,
            status
          )
          values ($1, $2, 'Oil Change', 5000, 6, 'due_soon')
          returning id
        `,
        [userA, carId]
      );

      const todoResult = await pool.query(
        `
          insert into public.todo_items (
            owner_user_id,
            car_id,
            title,
            priority,
            status
          )
          values ($1, $2, 'Replace filter', 'medium', 'pending')
          returning id
        `,
        [userA, carId]
      );

      const completedTodoResult = await pool.query(
        `
          insert into public.todo_items (
            owner_user_id,
            car_id,
            title,
            priority,
            status
          )
          values ($1, $2, 'Completed task', 'medium', 'completed')
          returning id
        `,
        [userA, carId]
      );

      const foreignTodoResult = await pool.query(
        `
          insert into public.todo_items (
            owner_user_id,
            car_id,
            title,
            priority,
            status
          )
          values ($1, $2, 'Foreign todo', 'medium', 'pending')
          returning id
        `,
        [userB, foreignCarId]
      );

      await createEntryWorkflow({
        db: pool,
        userId: userA,
        input: {
          car_id: carId,
          entry_type: "fuel",
          date: "2026-03-17",
          mileage: 150,
          fuel_gallons: 10,
          fuel_price_per_gallon: 3.5,
          fuel_total_cost: 35,
          fuel_station: "Station A",
          fuel_octane: "87",
          was_full_tank: true,
          expense_category: "fuel",
          expense_amount: 35,
          description: "Fuel up",
          vendor: "Station A",
          parts_replaced: null,
          maintenance_item_id: null,
          todo_id: null,
          notes: null,
        },
      });

      const maintenanceEntry = await createEntryWorkflow({
        db: pool,
        userId: userA,
        input: {
          car_id: carId,
          entry_type: "maintenance_done",
          date: "2026-03-18",
          mileage: 155,
          fuel_gallons: null,
          fuel_price_per_gallon: null,
          fuel_total_cost: null,
          fuel_station: null,
          fuel_octane: null,
          was_full_tank: null,
          expense_category: "regular_maintenance",
          expense_amount: 49.99,
          description: "Oil change",
          vendor: "Local shop",
          parts_replaced: "Oil, filter",
          maintenance_item_id: maintenanceResult.rows[0].id,
          todo_id: todoResult.rows[0].id,
          notes: null,
        },
      });

      await assert.rejects(
        () =>
          createEntryWorkflow({
            db: pool,
            userId: userA,
            input: {
              car_id: carId,
              entry_type: "maintenance_expense",
              date: "2026-03-19",
              mileage: 160,
              fuel_gallons: null,
              fuel_price_per_gallon: null,
              fuel_total_cost: null,
              fuel_station: null,
              fuel_octane: null,
              was_full_tank: null,
              expense_category: "repairs",
              expense_amount: 120,
              description: "Blocked write",
              vendor: "Bad link",
              parts_replaced: null,
              maintenance_item_id: null,
              todo_id: foreignTodoResult.rows[0].id,
              notes: null,
            },
          }),
        (error) => {
          assert.equal(typeof error, "object");
          assert.equal(error.code, "validation");
          assert.match(error.message, /linked task/i);
          return true;
        }
      );

      await assert.rejects(
        () =>
          createEntryWorkflow({
            db: pool,
            userId: userA,
            input: {
              car_id: carId,
              entry_type: "maintenance_expense",
              date: "2026-03-19",
              mileage: 160,
              fuel_gallons: null,
              fuel_price_per_gallon: null,
              fuel_total_cost: null,
              fuel_station: null,
              fuel_octane: null,
              was_full_tank: null,
              expense_category: "repairs",
              expense_amount: 120,
              description: "Completed todo relink",
              vendor: "QA Garage",
              parts_replaced: null,
              maintenance_item_id: null,
              todo_id: completedTodoResult.rows[0].id,
              notes: null,
            },
          }),
        (error) => {
          assert.equal(typeof error, "object");
          assert.equal(error.code, "validation");
          assert.match(error.message, /linked task/i);
          return true;
        }
      );

      const [carState, maintenanceState, todoState, entryCount] = await Promise.all([
        pool.query(
          `
            select
              current_mileage,
              total_fuel_spent,
              total_maintenance_spent,
              total_improvements_spent,
              total_repairs_spent
            from public.cars
            where id = $1 and owner_user_id = $2
          `,
          [carId, userA]
        ),
        pool.query(
          `
            select
              last_done_mileage,
              last_done_date,
              next_due_mileage,
              next_due_date,
              status
            from public.maintenance_schedule_items
            where id = $1 and owner_user_id = $2
          `,
          [maintenanceResult.rows[0].id, userA]
        ),
        pool.query(
          `
            select status, linked_entry_id, completed_at
            from public.todo_items
            where id = $1 and owner_user_id = $2
          `,
          [todoResult.rows[0].id, userA]
        ),
        pool.query(
          `
            select count(*)::int as count
            from public.entries
            where owner_user_id = $1 and car_id = $2
          `,
          [userA, carId]
        ),
      ]);

      assert.equal(Number(carState.rows[0].current_mileage), 155);
      assert.equal(Number(carState.rows[0].total_fuel_spent), 35);
      assert.equal(Number(carState.rows[0].total_maintenance_spent), 49.99);
      assert.equal(Number(carState.rows[0].total_improvements_spent), 0);
      assert.equal(Number(carState.rows[0].total_repairs_spent), 0);

      assert.equal(Number(maintenanceState.rows[0].last_done_mileage), 155);
      assert.equal(toIsoDate(maintenanceState.rows[0].last_done_date), "2026-03-18");
      assert.equal(Number(maintenanceState.rows[0].next_due_mileage), 5155);
      assert.equal(toIsoDate(maintenanceState.rows[0].next_due_date), "2026-09-18");
      assert.equal(maintenanceState.rows[0].status, "upcoming");

      assert.equal(todoState.rows[0].status, "completed");
      assert.equal(typeof todoState.rows[0].linked_entry_id, "string");
      assert.equal(Boolean(todoState.rows[0].completed_at), true);

      assert.equal(entryCount.rows[0].count, 2);

      await pool.query(`delete from public.entries where id = $1`, [
        maintenanceEntry.id,
      ]);

      const todoAfterEntryDelete = await pool.query(
        `
          select owner_user_id, linked_entry_id
          from public.todo_items
          where id = $1 and owner_user_id = $2
        `,
        [todoResult.rows[0].id, userA]
      );

      assert.equal(todoAfterEntryDelete.rows[0].owner_user_id, userA);
      assert.equal(todoAfterEntryDelete.rows[0].linked_entry_id, null);
    } finally {
      if (canReachDatabase) {
        await cleanupOwnedTestData(pool, userA, userB);
      }

      await pool.end();
    }
  }
);
