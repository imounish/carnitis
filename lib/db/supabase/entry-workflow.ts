import type { Pool, PoolClient } from "pg";
import type { CreateEntryInput } from "../types";
import type { Entry } from "../schema";
import type { EntryRow, NumericValue, TimestampValue } from "./schema";
import { addMonthsToIsoDateClamped } from "../../time.js";

type Queryable = Pool | PoolClient;

interface MaintenanceLinkRow {
  id: string;
  interval_miles: number;
  interval_months: number | null;
}

function isPool(db: Queryable): db is Pool {
  return "connect" in db;
}

export async function createEntryWorkflow({
  db,
  userId,
  input,
}: {
  db: Queryable;
  userId: string;
  input: CreateEntryInput;
}) {
  const entry = input;
  const client = isPool(db) ? await db.connect() : db;
  const ownsTransaction = isPool(db);

  try {
    if (ownsTransaction) {
      await client.query("begin");
    }

    await client.query("select set_config('app.current_user_id', $1, true)", [
      userId,
    ]);

    const carResult = await client.query(
      `
        select id
        from public.cars
        where id = $1 and owner_user_id = $2
        for update
      `,
      [entry.car_id, userId]
    );

    if (carResult.rowCount !== 1) {
      throw createDataAccessLikeError("not_found", "That car could not be found.");
    }

    let maintenanceLink: MaintenanceLinkRow | null = null;
    if (entry.maintenance_item_id) {
      const result = await client.query<MaintenanceLinkRow>(
        `
          select id, interval_miles, interval_months
          from public.maintenance_schedule_items
          where id = $1
            and owner_user_id = $2
            and car_id = $3
          for update
        `,
        [entry.maintenance_item_id, userId, entry.car_id]
      );

      if (result.rowCount !== 1) {
        throw createDataAccessLikeError(
          "validation",
          "The linked maintenance item is invalid for this car."
        );
      }

      maintenanceLink = {
        id: result.rows[0].id,
        interval_miles: Number(result.rows[0].interval_miles),
        interval_months: result.rows[0].interval_months,
      };
    }

    if (entry.todo_id) {
      const result = await client.query(
        `
          select id
          from public.todo_items
          where id = $1
            and owner_user_id = $2
            and car_id = $3
            and status in ('pending', 'in_progress')
            and linked_entry_id is null
          for update
        `,
        [entry.todo_id, userId, entry.car_id]
      );

      if (result.rowCount !== 1) {
        throw createDataAccessLikeError(
          "validation",
          "The linked task is invalid for this car."
        );
      }
    }

    const entryResult = await client.query(
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
          fuel_octane,
          was_full_tank,
          expense_category,
          expense_amount,
          description,
          vendor,
          parts_replaced,
          maintenance_item_id,
          todo_id,
          notes
        )
        values (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19
        )
        returning *
      `,
      [
        userId,
        entry.car_id,
        entry.entry_type,
        entry.date,
        entry.mileage,
        entry.fuel_gallons,
        entry.fuel_price_per_gallon,
        entry.fuel_total_cost,
        entry.fuel_station,
        entry.fuel_octane,
        entry.was_full_tank,
        entry.expense_category,
        entry.expense_amount,
        entry.description,
        entry.vendor,
        entry.parts_replaced,
        entry.maintenance_item_id,
        entry.todo_id,
        entry.notes,
      ]
    );

    const amount = entry.expense_amount ?? entry.fuel_total_cost ?? 0;

    await client.query(
      `
        update public.cars
        set
          current_mileage = greatest(current_mileage, $3),
          total_fuel_spent = total_fuel_spent + $4,
          total_maintenance_spent = total_maintenance_spent + $5,
          total_improvements_spent = total_improvements_spent + $6,
          total_repairs_spent = total_repairs_spent + $7,
          updated_at = timezone('utc', now())
        where id = $1 and owner_user_id = $2
      `,
      [
        entry.car_id,
        userId,
        entry.mileage,
        entry.expense_category === "fuel" ? amount : 0,
        entry.expense_category === "regular_maintenance" ||
        entry.expense_category === "preventive_maintenance"
          ? amount
          : 0,
        entry.expense_category === "improvements" ? amount : 0,
        entry.expense_category === "repairs" ? amount : 0,
      ]
    );

    if (maintenanceLink) {
      await client.query(
        `
          update public.maintenance_schedule_items
          set
            last_done_mileage = $3,
            last_done_date = $4,
            next_due_mileage = $5,
            next_due_date = $6,
            status = 'upcoming',
            updated_at = timezone('utc', now())
          where id = $1 and owner_user_id = $2
        `,
        [
          maintenanceLink.id,
          userId,
          entry.mileage,
          entry.date,
          entry.mileage + maintenanceLink.interval_miles,
          maintenanceLink.interval_months
            ? addMonthsToIsoDateClamped(
                entry.date,
                maintenanceLink.interval_months
              )
            : null,
        ]
      );
    }

    if (entry.todo_id) {
      await client.query(
        `
          update public.todo_items
          set
            status = 'completed',
            linked_entry_id = $3,
            completed_at = timezone('utc', now()),
            updated_at = timezone('utc', now())
          where id = $1 and owner_user_id = $2
        `,
        [entry.todo_id, userId, entryResult.rows[0].id]
      );
    }

    if (ownsTransaction) {
      await client.query("commit");
    }

    return mapEntryRow(entryResult.rows[0]);
  } catch (error) {
    if (ownsTransaction) {
      await client.query("rollback").catch(() => {});
    }
    throw error;
  } finally {
    if (ownsTransaction) {
      client.release();
    }
  }
}

function createDataAccessLikeError(
  code: "validation" | "not_found",
  message: string
) {
  return {
    code,
    status: code === "not_found" ? 404 : 400,
    message,
  };
}

function mapEntryRow(row: EntryRow): Entry {
  return {
    id: row.id,
    car_id: row.car_id,
    entry_type: row.entry_type,
    date: row.date,
    mileage: toRequiredNumber(row.mileage),
    fuel_gallons: toNumber(row.fuel_gallons),
    fuel_price_per_gallon: toNumber(row.fuel_price_per_gallon),
    fuel_total_cost: toNumber(row.fuel_total_cost),
    fuel_station: row.fuel_station,
    fuel_octane: row.fuel_octane,
    was_full_tank: row.was_full_tank,
    expense_category: row.expense_category,
    expense_amount: toNumber(row.expense_amount),
    description: row.description,
    vendor: row.vendor,
    parts_replaced: row.parts_replaced,
    maintenance_item_id: row.maintenance_item_id,
    todo_id: row.todo_id,
    notes: row.notes,
    created_at: toIsoTimestamp(row.created_at),
    updated_at: toIsoTimestamp(row.updated_at),
  };
}

function toNumber(value: NumericValue | null): number | null {
  if (value === null) {
    return null;
  }

  return typeof value === "number" ? value : Number(value);
}

function toRequiredNumber(value: NumericValue): number {
  return typeof value === "number" ? value : Number(value);
}

function toIsoTimestamp(value: TimestampValue): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
