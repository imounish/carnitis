import "server-only";

import { Kysely, sql } from "kysely";
import { getKyselyDb } from "@/lib/kysely";
import type { AppDatabase } from "@/lib/db/supabase/schema";

function getAppDatabase(): Kysely<AppDatabase> {
  return getKyselyDb() as Kysely<AppDatabase>;
}

export async function withUserDatabase<T>(
  userId: string,
  callback: (db: Kysely<AppDatabase>) => Promise<T>
) {
  return getAppDatabase().transaction().execute(async (trx) => {
    await sql`select set_config('app.current_user_id', ${userId}, true)`.execute(
      trx
    );

    return callback(trx as Kysely<AppDatabase>);
  });
}
