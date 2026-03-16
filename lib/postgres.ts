import { Pool } from "pg";
import { getServerEnv } from "@/lib/env";

declare global {
  var __carnitisPostgresPool: Pool | undefined;
}

export function getPostgresPool() {
  if (globalThis.__carnitisPostgresPool) {
    return globalThis.__carnitisPostgresPool;
  }

  const env = getServerEnv();
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
  });

  if (process.env.NODE_ENV !== "production") {
    globalThis.__carnitisPostgresPool = pool;
  }

  return pool;
}
