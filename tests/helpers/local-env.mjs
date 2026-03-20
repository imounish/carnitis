import fs from "node:fs";
import path from "node:path";

export function loadLocalEnv() {
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
    const value = line
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }

  return Boolean(process.env.DATABASE_URL);
}

export async function cleanupOwnedTestData(pool, ...userIds) {
  if (userIds.length === 0) {
    return;
  }

  await pool.query(
    `delete from public.entries where owner_user_id = any($1::text[])`,
    [userIds]
  );
  await pool.query(
    `delete from public.todo_items where owner_user_id = any($1::text[])`,
    [userIds]
  );
  await pool.query(
    `delete from public.maintenance_schedule_items where owner_user_id = any($1::text[])`,
    [userIds]
  );
  await pool.query(
    `delete from public.cars where owner_user_id = any($1::text[])`,
    [userIds]
  );
  await pool.query(
    `delete from public.user_profiles where user_id = any($1::text[])`,
    [userIds]
  );
  await pool.query(
    `delete from public."user" where id = any($1::text[])`,
    [userIds]
  );
}
