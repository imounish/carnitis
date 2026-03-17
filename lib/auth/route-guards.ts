import type { AuthSession } from "@/lib/auth/types";

export function getProtectedAppRedirect(session: AuthSession | null) {
  if (!session) {
    return "/sign-in";
  }

  if (!session.user.onboardingCompleted) {
    return "/onboarding";
  }

  return null;
}

export function getAuthPageRedirect(
  session: AuthSession | null,
  nextPath = "/"
) {
  if (!session) {
    return null;
  }

  if (!session.user.onboardingCompleted) {
    return "/onboarding";
  }

  return nextPath;
}
