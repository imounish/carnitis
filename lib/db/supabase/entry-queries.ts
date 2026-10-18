import type { Pool, PoolClient } from "pg";
import type { Entry, EntryType } from "../schema";
import type { EntryRow, NumericValue, TimestampValue } from "./schema";

type Queryable = Pool | PoolClient;

export async function listEntriesByCarIdQuery({
  db,
  userId,
  carId,
  entryType,
}: {
  db: Queryable;
  userId: string;
  carId: string;
  entryType?: EntryType;
}) {
  const params: Array<string> = [userId, carId];
  let entryTypeClause = "";

  if (entryType) {
    params.push(entryType);
    entryTypeClause = `and entry_type = $${params.length}`;
  }

  const result = await db.query(
    `
      select *
      from public.entries
      where owner_user_id = $1
        and car_id = $2
        ${entryTypeClause}
      order by date desc, created_at desc
    `,
    params
  );

  return result.rows.map(mapEntryRow);
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
    fuel_level_before: row.fuel_level_before,
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
