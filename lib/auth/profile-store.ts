import "server-only";

import { Kysely } from "kysely";
import { getKyselyDb } from "@/lib/kysely";
import type { AuthProfileUpdateInput } from "@/lib/auth/types";
import type { UserProfileRecord } from "@/lib/auth/auth-mappers";

interface BetterAuthUserRow {
  id: string;
  email: string;
  name: string;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthDatabase {
  user: BetterAuthUserRow;
  user_profiles: UserProfileRecord;
}

interface EnsureProfileInput {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
}

function getAuthDb(): Kysely<AuthDatabase> {
  return getKyselyDb() as Kysely<AuthDatabase>;
}

function normalizeDisplayName(value: string): string {
  return value.trim() || "Driver";
}

export async function getAuthUserById(userId: string) {
  return getAuthDb()
    .selectFrom("user")
    .selectAll()
    .where("id", "=", userId)
    .executeTakeFirst();
}

export async function ensureUserProfile(input: EnsureProfileInput) {
  const db = getAuthDb();

  await db
    .insertInto("user_profiles")
    .values({
      user_id: input.userId,
      display_name: normalizeDisplayName(input.displayName),
      avatar_url: input.avatarUrl,
      onboarding_completed: false,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .onConflict((oc) => oc.column("user_id").doNothing())
    .execute();

  return db
    .selectFrom("user_profiles")
    .selectAll()
    .where("user_id", "=", input.userId)
    .executeTakeFirstOrThrow();
}

export async function updateUserProfile(
  userId: string,
  input: AuthProfileUpdateInput
): Promise<UserProfileRecord> {
  const db = getAuthDb();

  return db.transaction().execute(async (trx) => {
    const currentUser = await trx
      .selectFrom("user")
      .selectAll()
      .where("id", "=", userId)
      .executeTakeFirst();

    if (!currentUser) {
      throw new Error("Authenticated user record could not be found.");
    }

    const currentProfile = await trx
      .selectFrom("user_profiles")
      .selectAll()
      .where("user_id", "=", userId)
      .executeTakeFirst();

    const nextDisplayName =
      input.displayName !== undefined
        ? normalizeDisplayName(input.displayName)
        : currentProfile?.display_name ?? normalizeDisplayName(currentUser.name);
    const nextAvatarUrl =
      input.avatarUrl !== undefined
        ? input.avatarUrl
        : currentProfile?.avatar_url ?? currentUser.image ?? null;
    const nextOnboardingCompleted =
      input.onboardingCompleted ?? currentProfile?.onboarding_completed ?? false;
    const now = new Date();

    await trx
      .updateTable("user")
      .set({
        name: nextDisplayName,
        image: nextAvatarUrl,
        updatedAt: now,
      })
      .where("id", "=", userId)
      .execute();

    await trx
      .insertInto("user_profiles")
      .values({
        user_id: userId,
        display_name: nextDisplayName,
        avatar_url: nextAvatarUrl,
        onboarding_completed: nextOnboardingCompleted,
        created_at: currentProfile?.created_at ?? now,
        updated_at: now,
      })
      .onConflict((oc) =>
        oc.column("user_id").doUpdateSet({
          display_name: nextDisplayName,
          avatar_url: nextAvatarUrl,
          onboarding_completed: nextOnboardingCompleted,
          updated_at: now,
        })
      )
      .execute();

    return trx
      .selectFrom("user_profiles")
      .selectAll()
      .where("user_id", "=", userId)
      .executeTakeFirstOrThrow();
  });
}
