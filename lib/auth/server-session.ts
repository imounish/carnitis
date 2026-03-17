import "server-only";

import { headers as nextHeaders } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { mapBetterAuthSession } from "@/lib/auth/auth-mappers";
import { ensureUserProfile } from "@/lib/auth/profile-store";

async function resolveAppSession(requestHeaders: Headers) {
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session) {
    return null;
  }

  const profile = await ensureUserProfile({
    userId: session.user.id,
    displayName: session.user.name,
    avatarUrl: session.user.image ?? null,
  });

  return mapBetterAuthSession(session, profile);
}

export async function getServerAuthSession() {
  const requestHeaders = await nextHeaders();
  return resolveAppSession(requestHeaders);
}

export async function getAuthSessionFromHeaders(requestHeaders: Headers) {
  return resolveAppSession(requestHeaders);
}
