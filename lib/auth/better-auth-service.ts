"use client";

import { authClient } from "@/lib/auth/client";
import { mapBetterAuthErrorCode } from "@/lib/auth/auth-mappers";
import type { AuthService } from "@/lib/auth/service";
import type {
  AuthProfileUpdateInput,
  AuthProvider,
  AuthResult,
  AuthSession,
  AuthUser,
  SignInInput,
  SignUpInput,
} from "@/lib/auth/types";

interface ApiEnvelope<T> {
  data: T;
}

function ok<T>(data: T): AuthResult<T> {
  return { data, error: null };
}

function fail<T>(message: string, status?: number): AuthResult<T> {
  return {
    data: null,
    error: {
      code: mapBetterAuthErrorCode(message, status),
      message,
    },
  };
}

async function readJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function getOAuthCallbackURL(): string {
  if (typeof window === "undefined") {
    return "/";
  }

  const { origin, pathname, search } = window.location;

  if (pathname === "/sign-in") {
    const params = new URLSearchParams(search);
    const nextPath = params.get("next") || "/";
    return new URL(nextPath, origin).toString();
  }

  return new URL("/", origin).toString();
}

function getOAuthErrorURL(): string {
  if (typeof window === "undefined") {
    return "/sign-in";
  }

  return new URL(window.location.pathname + window.location.search, window.location.origin)
    .toString();
}

export class BetterAuthService implements AuthService {
  async signInWithPassword(input: SignInInput): Promise<AuthResult<AuthSession>> {
    const { error } = await authClient.signIn.email({
      email: input.email.trim(),
      password: input.password,
      rememberMe: true,
    });

    if (error) {
      return fail(error.message || "Unable to sign in.", error.status);
    }

    return this.getSession();
  }

  async signUpWithPassword(input: SignUpInput): Promise<AuthResult<AuthSession>> {
    const { error } = await authClient.signUp.email({
      email: input.email.trim(),
      password: input.password,
      name: input.displayName.trim(),
      callbackURL: "/onboarding",
    });

    if (error) {
      return fail(error.message || "Unable to create account.", error.status);
    }

    return this.getSession();
  }

  async signInWithOAuth(provider: AuthProvider): Promise<AuthResult<AuthSession>> {
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: getOAuthCallbackURL(),
      newUserCallbackURL: "/onboarding",
      errorCallbackURL: getOAuthErrorURL(),
    });

    if (error) {
      return fail(error.message || "Unable to continue with OAuth.", error.status);
    }

    return {
      data: null,
      error: null,
    };
  }

  async signOut(): Promise<AuthResult<true>> {
    const { error } = await authClient.signOut();

    if (error) {
      return fail(error.message || "Unable to sign out.", error.status);
    }

    return ok(true);
  }

  async getSession(): Promise<AuthResult<AuthSession>> {
    const response = await fetch("/api/me", {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      const payload = await readJson<{ error?: { message?: string } }>(response);
      return {
        data: null,
        error: {
          code: "session_not_found",
          message: payload?.error?.message || "No active session found.",
        },
      };
    }

    const payload = await readJson<ApiEnvelope<AuthSession>>(response);
    if (!payload) {
      return fail("Unable to read the current session.", response.status);
    }

    return ok(payload.data);
  }

  async updateProfile(
    input: AuthProfileUpdateInput
  ): Promise<AuthResult<AuthUser>> {
    const response = await fetch("/api/me", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const payload = await readJson<{ error?: { message?: string } }>(response);
      if (response.status === 401) {
        return {
          data: null,
          error: {
            code: "unauthorized",
            message: payload?.error?.message || "You need to sign in first.",
          },
        };
      }

      return fail(
        payload?.error?.message || "Unable to update your profile.",
        response.status
      );
    }

    const payload = await readJson<ApiEnvelope<AuthUser>>(response);
    if (!payload) {
      return fail("Unable to read the updated profile.", response.status);
    }

    return ok(payload.data);
  }
}
