import type { AuthErrorCode, AuthSession, AuthUser } from "@/lib/auth/types";

interface BetterAuthSessionLike {
  session: {
    token: string;
    expiresAt: Date | string;
  };
  user: {
    id: string;
    email: string;
    name: string;
    image?: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
  };
}

export interface UserProfileRecord {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  onboarding_completed: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export function mapBetterAuthErrorCode(message: string, status?: number): AuthErrorCode {
  const normalized = message.toLowerCase();

  if (status === 401 || normalized.includes("invalid password")) {
    return "invalid_credentials";
  }

  if (status === 409 || normalized.includes("already exists")) {
    return "email_already_in_use";
  }

  if (status === 403 || normalized.includes("unauthorized")) {
    return "unauthorized";
  }

  if (normalized.includes("network") || normalized.includes("fetch")) {
    return "network_error";
  }

  return "unknown";
}

export function mapProfileToAuthUser(
  user: BetterAuthSessionLike["user"],
  profile: UserProfileRecord
): AuthUser {
  return {
    id: user.id,
    email: user.email,
    displayName: profile.display_name,
    avatarUrl: profile.avatar_url,
    onboardingCompleted: profile.onboarding_completed,
    createdAt: toIsoString(user.createdAt),
    updatedAt: toIsoString(profile.updated_at),
  };
}

export function mapBetterAuthSession(
  session: BetterAuthSessionLike,
  profile: UserProfileRecord
): AuthSession {
  return {
    accessToken: session.session.token,
    refreshToken: null,
    expiresAt: toIsoString(session.session.expiresAt),
    user: mapProfileToAuthUser(session.user, profile),
  };
}
