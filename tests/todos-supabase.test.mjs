import assert from "node:assert/strict";
import test from "node:test";
import { Pool } from "pg";
import {
  compareTodos,
  isTodoActive,
  normalizeDirectTodoUpdates,
  todoPriorityOrder,
} from "../lib/db/todo-helpers.ts";
import { cleanupOwnedTestData, loadLocalEnv } from "./helpers/local-env.mjs";

test(
  "todo rows stay owner-scoped and preserve direct-update semantics in local Supabase",
  { skip: !loadLocalEnv() },
  async (t) => {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const userA = `todos-user-a-${suffix}`;
    const userB = `todos-user-b-${suffix}`;
    const emailA = `todos-a-${suffix}@example.com`;
    const emailB = `todos-b-${suffix}@example.com`;
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
            ($1, 'Todos User A', $2, true, timezone('utc', now()), timezone('utc', now())),
            ($3, 'Todos User B', $4, true, timezone('utc', now()), timezone('utc', now()))
        `,
        [userA, emailA, userB, emailB]
      );

      const [{ rows: userACarRows }, { rows: userBCarRows }] = await Promise.all([
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
            values ($1, 'Todos Car A', 'Toyota', 'Camry', 2024, 12000, 'gasoline')
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
            values ($1, 'Todos Car B', 'Honda', 'Civic', 2023, 5000, 'gasoline')
            returning id
          `,
          [userB]
        ),
      ]);

      const carAId = userACarRows[0].id;
      const carBId = userBCarRows[0].id;

      const todoInsert = await pool.query(
        `
          insert into public.todo_items (
            owner_user_id,
            car_id,
            title,
            priority,
            status
          )
          values
            ($1, $2, 'Pending medium', 'medium', 'pending'),
            ($1, $2, 'In progress high', 'high', 'in_progress'),
            ($1, $2, 'Completed urgent', 'urgent', 'completed'),
            ($3, $4, 'Foreign pending', 'low', 'pending')
          returning id, owner_user_id, car_id, title, priority, status, linked_entry_id, completed_at
        `,
        [userA, carAId, userB, carBId]
      );

      const ownedTodoIds = todoInsert.rows
        .filter((row) => row.owner_user_id === userA)
        .map((row) => row.id);

      const ownedCarRows = await pool.query(
        `
          select id, title, priority, status, linked_entry_id, completed_at
          from public.todo_items
          where owner_user_id = $1 and car_id = $2
        `,
        [userA, carAId]
      );

      const orderedByRoute = [...ownedCarRows.rows].sort(compareTodos);
      assert.deepEqual(
        orderedByRoute.map((todo) => todo.title),
        ["In progress high", "Pending medium", "Completed urgent"]
      );

      const allOwnedRows = await pool.query(
        `
          select
            todo_items.id,
            todo_items.title,
            todo_items.priority,
            todo_items.status,
            cars.id as car_id,
            cars.name as car_name
          from public.todo_items
          inner join public.cars on cars.id = todo_items.car_id
          where todo_items.owner_user_id = $1
        `,
        [userA]
      );

      const dashboardRows = allOwnedRows.rows
        .filter(isTodoActive)
        .sort(
          (left, right) =>
            todoPriorityOrder[left.priority] - todoPriorityOrder[right.priority]
        );

      assert.deepEqual(
        dashboardRows.map((todo) => todo.title),
        ["In progress high", "Pending medium"]
      );
      assert.deepEqual(
        dashboardRows.map((todo) => todo.car_name),
        ["Todos Car A", "Todos Car A"]
      );

      const directComplete = normalizeDirectTodoUpdates({
        status: "completed",
        linked_entry_id: "entry-ignored",
        completed_at: null,
      });

      const completedResult = await pool.query(
        `
          update public.todo_items
          set
            status = $3,
            linked_entry_id = $4,
            completed_at = $5,
            updated_at = timezone('utc', now())
          where id = $1 and owner_user_id = $2
          returning status, linked_entry_id, completed_at
        `,
        [
          ownedTodoIds[0],
          userA,
          directComplete.status,
          directComplete.linked_entry_id,
          directComplete.completed_at,
        ]
      );

      assert.equal(completedResult.rows[0].status, "completed");
      assert.equal(completedResult.rows[0].linked_entry_id, null);
      assert.equal(Boolean(completedResult.rows[0].completed_at), true);

      const entryResult = await pool.query(
        `
          insert into public.entries (
            owner_user_id,
            car_id,
            entry_type,
            date,
            mileage
          )
          values ($1, $2, 'maintenance_done', '2026-03-18', 12500)
          returning id
        `,
        [userA, carAId]
      );

      const linkedTodoResult = await pool.query(
        `
          insert into public.todo_items (
            owner_user_id,
            car_id,
            title,
            priority,
            status,
            linked_entry_id,
            completed_at
          )
          values (
            $1,
            $2,
            'Linked completed todo',
            'medium',
            'completed',
            $3,
            timezone('utc', now())
          )
          returning id
        `,
        [userA, carAId, entryResult.rows[0].id]
      );

      const reopenedUpdate = normalizeDirectTodoUpdates({
        status: "pending",
      });

      const reopenedResult = await pool.query(
        `
          update public.todo_items
          set
            status = $3,
            linked_entry_id = $4,
            completed_at = $5,
            updated_at = timezone('utc', now())
          where id = $1 and owner_user_id = $2
          returning status, linked_entry_id, completed_at
        `,
        [
          linkedTodoResult.rows[0].id,
          userA,
          reopenedUpdate.status,
          reopenedUpdate.linked_entry_id,
          reopenedUpdate.completed_at,
        ]
      );

      assert.equal(reopenedResult.rows[0].status, "pending");
      assert.equal(reopenedResult.rows[0].linked_entry_id, null);
      assert.equal(reopenedResult.rows[0].completed_at, null);

      const foreignUpdate = await pool.query(
        `
          update public.todo_items
          set title = 'Foreign edit'
          where id = $1 and owner_user_id = $2
          returning id
        `,
        [ownedTodoIds[1], userB]
      );
      assert.equal(foreignUpdate.rowCount, 0);

      const foreignDelete = await pool.query(
        `
          delete from public.todo_items
          where id = $1 and owner_user_id = $2
          returning id
        `,
        [ownedTodoIds[2], userB]
      );
      assert.equal(foreignDelete.rowCount, 0);

      const ownerDelete = await pool.query(
        `
          delete from public.todo_items
          where id = $1 and owner_user_id = $2
          returning id
        `,
        [ownedTodoIds[2], userA]
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
