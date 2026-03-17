import "server-only";

import { DataAccessError } from "@/lib/db/errors";
import { createSupabaseDataAccess } from "@/lib/db/supabase/data-access";
import {
  getAuthSessionFromHeaders,
  getServerAuthSession,
} from "@/lib/auth/server-session";

export async function getServerDataAccess() {
  const session = await getServerAuthSession();
  if (!session) {
    throw new DataAccessError(
      "unauthorized",
      "A signed-in session is required for server-side data access."
    );
  }

  return createSupabaseDataAccess({ userId: session.user.id });
}

export async function getServerDataAccessFromHeaders(requestHeaders: Headers) {
  const session = await getAuthSessionFromHeaders(requestHeaders);
  if (!session) {
    throw new DataAccessError(
      "unauthorized",
      "A signed-in session is required for server-side data access."
    );
  }

  return createSupabaseDataAccess({ userId: session.user.id });
}
