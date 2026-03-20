import "server-only";

import type { Kysely } from "kysely";
import { getPostgresPool } from "@/lib/postgres";
import type { DataAccess, RepositoryContext } from "@/lib/db/contracts";
import { logDataAccessError } from "@/lib/db/logger";
import type { Car, MaintenanceItemStatus, TodoStatus } from "@/lib/db/schema";
import { mapCarRow, mapEntryRow, mapMaintenanceItemRow, mapTodoRow } from "@/lib/db/supabase/mappers";
import { withUserDatabase } from "@/lib/db/supabase/scoped-db";
import type { AppDatabase } from "@/lib/db/supabase/schema";
import { listEntriesByCarIdQuery } from "@/lib/db/supabase/entry-queries";
import { createEntryWorkflow } from "@/lib/db/supabase/entry-workflow";
import {
  parseCreateCarInput,
  parseCreateEntryInput,
  parseCreateMaintenanceItemInput,
  parseCreateTodoInput,
  parseUpdateCarInput,
  parseUpdateMaintenanceItemInput,
  parseUpdateTodoInput,
} from "@/lib/db/validation";

const maintenanceOrder: Record<MaintenanceItemStatus, number> = {
  overdue: 0,
  due_soon: 1,
  upcoming: 2,
  completed: 3,
};

const todoStatusOrder: Record<TodoStatus, number> = {
  in_progress: 0,
  pending: 1,
  completed: 2,
  cancelled: 3,
};

const todoPriorityOrder = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function getCarJoin(row: {
  car_id: string;
  car_name: string;
  car_make: string;
  car_model: string;
  car_year: number;
  car_vin: string | null;
  car_color: string | null;
  car_license_plate: string | null;
  car_current_mileage: string | number;
  car_fuel_tank_capacity: string | number | null;
  car_fuel_type: string | null;
  car_total_fuel_spent: string | number;
  car_total_maintenance_spent: string | number;
  car_total_improvements_spent: string | number;
  car_total_repairs_spent: string | number;
  car_image_url: string | null;
  car_notes: string | null;
  car_created_at: string | Date;
  car_updated_at: string | Date;
}): Car {
  return mapCarRow({
    id: row.car_id,
    owner_user_id: "",
    name: row.car_name,
    make: row.car_make,
    model: row.car_model,
    year: row.car_year,
    vin: row.car_vin,
    color: row.car_color,
    license_plate: row.car_license_plate,
    current_mileage: row.car_current_mileage,
    fuel_tank_capacity: row.car_fuel_tank_capacity,
    fuel_type: row.car_fuel_type,
    total_fuel_spent: row.car_total_fuel_spent,
    total_maintenance_spent: row.car_total_maintenance_spent,
    total_improvements_spent: row.car_total_improvements_spent,
    total_repairs_spent: row.car_total_repairs_spent,
    image_url: row.car_image_url,
    notes: row.car_notes,
    created_at: row.car_created_at,
    updated_at: row.car_updated_at,
  });
}

async function selectCarById(
  db: Kysely<AppDatabase>,
  userId: string,
  id: string
) {
  return db
    .selectFrom("cars")
    .selectAll()
    .where("id", "=", id)
    .where("owner_user_id", "=", userId)
    .executeTakeFirst();
}

export function createSupabaseDataAccess(context: RepositoryContext): DataAccess {
  return {
    cars: {
      async list() {
        try {
          const rows = await withUserDatabase(context.userId, async (db) =>
            db
              .selectFrom("cars")
              .selectAll()
              .where("owner_user_id", "=", context.userId)
              .orderBy("updated_at", "desc")
              .execute()
          );

          return rows.map(mapCarRow);
        } catch (error) {
          throw logDataAccessError(
            { operation: "list", entity: "car", userId: context.userId },
            error
          );
        }
      },
      async getById(id) {
        try {
          const row = await withUserDatabase(context.userId, async (db) =>
            selectCarById(db, context.userId, id)
          );

          return row ? mapCarRow(row) : null;
        } catch (error) {
          throw logDataAccessError(
            {
              operation: "getById",
              entity: "car",
              userId: context.userId,
              metadata: { id },
            },
            error
          );
        }
      },
      async create(input) {
        try {
          const car = parseCreateCarInput(input);
          const now = new Date();

          const row = await withUserDatabase(context.userId, async (db) =>
            db
              .insertInto("cars")
              .values({
                owner_user_id: context.userId,
                name: car.name,
                make: car.make,
                model: car.model,
                year: car.year,
                vin: car.vin,
                color: car.color,
                license_plate: car.license_plate,
                current_mileage: car.current_mileage,
                fuel_tank_capacity: car.fuel_tank_capacity,
                fuel_type: car.fuel_type,
                total_fuel_spent: 0,
                total_maintenance_spent: 0,
                total_improvements_spent: 0,
                total_repairs_spent: 0,
                image_url: car.image_url,
                notes: car.notes,
                created_at: now,
                updated_at: now,
              })
              .returningAll()
              .executeTakeFirstOrThrow()
          );

          return mapCarRow(row);
        } catch (error) {
          throw logDataAccessError(
            { operation: "create", entity: "car", userId: context.userId },
            error
          );
        }
      },
      async update(id, updates) {
        try {
          const parsedUpdates = parseUpdateCarInput(updates);
          const row = await withUserDatabase(context.userId, async (db) =>
            db
              .updateTable("cars")
              .set({
                ...parsedUpdates,
                updated_at: new Date(),
              })
              .where("id", "=", id)
              .where("owner_user_id", "=", context.userId)
              .returningAll()
              .executeTakeFirst()
          );

          return row ? mapCarRow(row) : null;
        } catch (error) {
          throw logDataAccessError(
            {
              operation: "update",
              entity: "car",
              userId: context.userId,
              metadata: { id },
            },
            error
          );
        }
      },
      async delete(id) {
        try {
          const result = await withUserDatabase(context.userId, async (db) =>
            db
              .deleteFrom("cars")
              .where("id", "=", id)
              .where("owner_user_id", "=", context.userId)
              .executeTakeFirst()
          );

          return Number(result.numDeletedRows ?? 0) > 0;
        } catch (error) {
          throw logDataAccessError(
            {
              operation: "delete",
              entity: "car",
              userId: context.userId,
              metadata: { id },
            },
            error
          );
        }
      },
    },
    entries: {
      async listByCarId(carId, entryType) {
        try {
          return listEntriesByCarIdQuery({
            db: getPostgresPool(),
            userId: context.userId,
            carId,
            entryType,
          });
        } catch (error) {
          throw logDataAccessError(
            {
              operation: "listByCarId",
              entity: "entry",
              userId: context.userId,
              metadata: { carId, entryType },
            },
            error
          );
        }
      },
      async listRecent(limit = 10) {
        try {
          const rows = await withUserDatabase(context.userId, async (db) =>
            db
              .selectFrom("entries")
              .innerJoin("cars", "cars.id", "entries.car_id")
              .selectAll("entries")
              .select([
                "cars.name as car_name",
                "cars.make as car_make",
                "cars.model as car_model",
                "cars.year as car_year",
                "cars.vin as car_vin",
                "cars.color as car_color",
                "cars.license_plate as car_license_plate",
                "cars.current_mileage as car_current_mileage",
                "cars.fuel_tank_capacity as car_fuel_tank_capacity",
                "cars.fuel_type as car_fuel_type",
                "cars.total_fuel_spent as car_total_fuel_spent",
                "cars.total_maintenance_spent as car_total_maintenance_spent",
                "cars.total_improvements_spent as car_total_improvements_spent",
                "cars.total_repairs_spent as car_total_repairs_spent",
                "cars.image_url as car_image_url",
                "cars.notes as car_notes",
                "cars.created_at as car_created_at",
                "cars.updated_at as car_updated_at",
              ])
              .where("entries.owner_user_id", "=", context.userId)
              .orderBy("entries.date", "desc")
              .orderBy("entries.created_at", "desc")
              .limit(limit)
              .execute()
          );

          return rows.map((row) => ({
            ...mapEntryRow(row),
            car: getCarJoin(row),
          }));
        } catch (error) {
          throw logDataAccessError(
            {
              operation: "listRecent",
              entity: "entry",
              userId: context.userId,
              metadata: { limit },
            },
            error
          );
        }
      },
      async create(input) {
        try {
          const entry = parseCreateEntryInput(input);
          return createEntryWorkflow({
            db: getPostgresPool(),
            userId: context.userId,
            input: entry,
          });
        } catch (error) {
          throw logDataAccessError(
            { operation: "create", entity: "entry", userId: context.userId },
            error
          );
        }
      },
    },
    maintenance: {
      async listByCarId(carId) {
        try {
          const rows = await withUserDatabase(context.userId, async (db) =>
            db
              .selectFrom("maintenance_schedule_items")
              .selectAll()
              .where("owner_user_id", "=", context.userId)
              .where("car_id", "=", carId)
              .execute()
          );

          return rows
            .map(mapMaintenanceItemRow)
            .sort((left, right) => maintenanceOrder[left.status] - maintenanceOrder[right.status]);
        } catch (error) {
          throw logDataAccessError(
            {
              operation: "listByCarId",
              entity: "maintenance_item",
              userId: context.userId,
              metadata: { carId },
            },
            error
          );
        }
      },
      async listUpcoming() {
        try {
          const rows = await withUserDatabase(context.userId, async (db) =>
            db
              .selectFrom("maintenance_schedule_items")
              .innerJoin("cars", "cars.id", "maintenance_schedule_items.car_id")
              .selectAll("maintenance_schedule_items")
              .select([
                "cars.name as car_name",
                "cars.make as car_make",
                "cars.model as car_model",
                "cars.year as car_year",
                "cars.vin as car_vin",
                "cars.color as car_color",
                "cars.license_plate as car_license_plate",
                "cars.current_mileage as car_current_mileage",
                "cars.fuel_tank_capacity as car_fuel_tank_capacity",
                "cars.fuel_type as car_fuel_type",
                "cars.total_fuel_spent as car_total_fuel_spent",
                "cars.total_maintenance_spent as car_total_maintenance_spent",
                "cars.total_improvements_spent as car_total_improvements_spent",
                "cars.total_repairs_spent as car_total_repairs_spent",
                "cars.image_url as car_image_url",
                "cars.notes as car_notes",
                "cars.created_at as car_created_at",
                "cars.updated_at as car_updated_at",
              ])
              .where("maintenance_schedule_items.owner_user_id", "=", context.userId)
              .where("maintenance_schedule_items.status", "!=", "completed")
              .execute()
          );

          return rows
            .map((row) => ({
              ...mapMaintenanceItemRow(row),
              car: getCarJoin(row),
            }))
            .sort((left, right) => maintenanceOrder[left.status] - maintenanceOrder[right.status]);
        } catch (error) {
          throw logDataAccessError(
            { operation: "listUpcoming", entity: "maintenance_item", userId: context.userId },
            error
          );
        }
      },
      async create(input) {
        try {
          const item = parseCreateMaintenanceItemInput(input);
          const now = new Date();
          const row = await withUserDatabase(context.userId, async (db) =>
            db
              .insertInto("maintenance_schedule_items")
              .values({
                owner_user_id: context.userId,
                car_id: item.car_id,
                name: item.name,
                description: item.description,
                interval_miles: item.interval_miles,
                interval_months: item.interval_months,
                last_done_mileage: item.last_done_mileage,
                last_done_date: item.last_done_date,
                next_due_mileage: item.next_due_mileage,
                next_due_date: item.next_due_date,
                status: item.status,
                estimated_cost: item.estimated_cost,
                notes: item.notes,
                created_at: now,
                updated_at: now,
              })
              .returningAll()
              .executeTakeFirstOrThrow()
          );

          return mapMaintenanceItemRow(row);
        } catch (error) {
          throw logDataAccessError(
            {
              operation: "create",
              entity: "maintenance_item",
              userId: context.userId,
            },
            error
          );
        }
      },
      async update(id, updates) {
        try {
          const parsedUpdates = parseUpdateMaintenanceItemInput(updates);
          const row = await withUserDatabase(context.userId, async (db) =>
            db
              .updateTable("maintenance_schedule_items")
              .set({
                ...parsedUpdates,
                updated_at: new Date(),
              })
              .where("id", "=", id)
              .where("owner_user_id", "=", context.userId)
              .returningAll()
              .executeTakeFirst()
          );

          return row ? mapMaintenanceItemRow(row) : null;
        } catch (error) {
          throw logDataAccessError(
            {
              operation: "update",
              entity: "maintenance_item",
              userId: context.userId,
              metadata: { id },
            },
            error
          );
        }
      },
    },
    todos: {
      async listByCarId(carId) {
        try {
          const rows = await withUserDatabase(context.userId, async (db) =>
            db
              .selectFrom("todo_items")
              .selectAll()
              .where("owner_user_id", "=", context.userId)
              .where("car_id", "=", carId)
              .execute()
          );

          return rows
            .map(mapTodoRow)
            .sort((left, right) => {
              if (todoStatusOrder[left.status] !== todoStatusOrder[right.status]) {
                return todoStatusOrder[left.status] - todoStatusOrder[right.status];
              }

              return todoPriorityOrder[left.priority] - todoPriorityOrder[right.priority];
            });
        } catch (error) {
          throw logDataAccessError(
            {
              operation: "listByCarId",
              entity: "todo",
              userId: context.userId,
              metadata: { carId },
            },
            error
          );
        }
      },
      async listAll() {
        try {
          const rows = await withUserDatabase(context.userId, async (db) =>
            db
              .selectFrom("todo_items")
              .innerJoin("cars", "cars.id", "todo_items.car_id")
              .selectAll("todo_items")
              .select([
                "cars.name as car_name",
                "cars.make as car_make",
                "cars.model as car_model",
                "cars.year as car_year",
                "cars.vin as car_vin",
                "cars.color as car_color",
                "cars.license_plate as car_license_plate",
                "cars.current_mileage as car_current_mileage",
                "cars.fuel_tank_capacity as car_fuel_tank_capacity",
                "cars.fuel_type as car_fuel_type",
                "cars.total_fuel_spent as car_total_fuel_spent",
                "cars.total_maintenance_spent as car_total_maintenance_spent",
                "cars.total_improvements_spent as car_total_improvements_spent",
                "cars.total_repairs_spent as car_total_repairs_spent",
                "cars.image_url as car_image_url",
                "cars.notes as car_notes",
                "cars.created_at as car_created_at",
                "cars.updated_at as car_updated_at",
              ])
              .where("todo_items.owner_user_id", "=", context.userId)
              .where("todo_items.status", "!=", "completed")
              .where("todo_items.status", "!=", "cancelled")
              .execute()
          );

          return rows
            .map((row) => ({
              ...mapTodoRow(row),
              car: getCarJoin(row),
            }))
            .sort(
              (left, right) =>
                todoPriorityOrder[left.priority] - todoPriorityOrder[right.priority]
            );
        } catch (error) {
          throw logDataAccessError(
            { operation: "listAll", entity: "todo", userId: context.userId },
            error
          );
        }
      },
      async create(input) {
        try {
          const todo = parseCreateTodoInput(input);
          const now = new Date();
          const row = await withUserDatabase(context.userId, async (db) =>
            db
              .insertInto("todo_items")
              .values({
                owner_user_id: context.userId,
                car_id: todo.car_id,
                title: todo.title,
                description: todo.description,
                priority: todo.priority,
                status: todo.status,
                category: todo.category,
                estimated_cost: todo.estimated_cost,
                linked_entry_id: null,
                due_date: todo.due_date,
                completed_at: null,
                created_at: now,
                updated_at: now,
              })
              .returningAll()
              .executeTakeFirstOrThrow()
          );

          return mapTodoRow(row);
        } catch (error) {
          throw logDataAccessError(
            { operation: "create", entity: "todo", userId: context.userId },
            error
          );
        }
      },
      async update(id, updates) {
        try {
          const parsedUpdates = parseUpdateTodoInput(updates);
          const row = await withUserDatabase(context.userId, async (db) =>
            db
              .updateTable("todo_items")
              .set({
                ...parsedUpdates,
                updated_at: new Date(),
              })
              .where("id", "=", id)
              .where("owner_user_id", "=", context.userId)
              .returningAll()
              .executeTakeFirst()
          );

          return row ? mapTodoRow(row) : null;
        } catch (error) {
          throw logDataAccessError(
            {
              operation: "update",
              entity: "todo",
              userId: context.userId,
              metadata: { id },
            },
            error
          );
        }
      },
    },
  };
}
