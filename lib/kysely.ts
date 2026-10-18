import { Kysely, PostgresDialect } from "kysely";
import { getPostgresPool } from "@/lib/postgres";

declare global {
  var __carnitisKysely: Kysely<unknown> | undefined;
}

export function getKyselyDb() {
  if (globalThis.__carnitisKysely) {
    return globalThis.__carnitisKysely;
  }

  const db = new Kysely<unknown>({
    dialect: new PostgresDialect({
      pool: getPostgresPool(),
    }),
  });

  globalThis.__carnitisKysely = db;

  return db;
}
