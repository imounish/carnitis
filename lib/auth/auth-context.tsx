"use client";

import * as React from "react";
import type { AuthService } from "@/lib/auth/service";
import { BetterAuthService } from "@/lib/auth/better-auth-service";
import type {
  AuthProfileUpdateInput,
  AuthProvider,
  AuthSession,
  AuthUser,
} from "@/lib/auth/types";

interface AuthContextValue {
  user: AuthUser | null;
  session: AuthSession | null;
  isLoading: boolean;
  errorMessage: string | null;
  signInWithPassword: (email: string, password: string) => Promise<boolean>;
  signUpWithPassword: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<boolean>;
  signInWithOAuth: (provider: AuthProvider) => Promise<boolean>;
  signOut: () => Promise<boolean>;
  updateProfile: (input: AuthProfileUpdateInput) => Promise<boolean>;
  clearError: () => void;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession?: AuthSession | null;
}) {
  const [service] = React.useState<AuthService>(() => new BetterAuthService());
  const [session, setSession] = React.useState<AuthSession | null>(initialSession ?? null);
  const [isLoading, setIsLoading] = React.useState(initialSession === undefined);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const result = await service.getSession();
      if (!mounted) return;

      setSession(result.data);
      setIsLoading(false);
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [service]);

  const signInWithPassword = React.useCallback(
    async (email: string, password: string): Promise<boolean> => {
      const result = await service.signInWithPassword({ email, password });
      if (result.error) {
        setErrorMessage(result.error.message);
        return false;
      }

      setSession(result.data);
      setErrorMessage(null);
      return true;
    },
    [service]
  );

  const signUpWithPassword = React.useCallback(
    async (email: string, password: string, displayName: string): Promise<boolean> => {
      const result = await service.signUpWithPassword({
        email,
        password,
        displayName,
      });
      if (result.error) {
        setErrorMessage(result.error.message);
        return false;
      }

      setSession(result.data);
      setErrorMessage(null);
      return true;
    },
    [service]
  );

  const signInWithOAuth = React.useCallback(
    async (provider: AuthProvider): Promise<boolean> => {
      const result = await service.signInWithOAuth(provider);
      if (result.error) {
        setErrorMessage(result.error.message);
        return false;
      }

      setSession(result.data);
      setErrorMessage(null);
      return true;
    },
    [service]
  );

  const signOut = React.useCallback(async (): Promise<boolean> => {
    const result = await service.signOut();
    if (result.error) {
      setErrorMessage(result.error.message);
      return false;
    }

    setSession(null);
    setErrorMessage(null);
    return true;
  }, [service]);

  const updateProfile = React.useCallback(
    async (input: AuthProfileUpdateInput): Promise<boolean> => {
      const result = await service.updateProfile(input);
      if (result.error) {
        setErrorMessage(result.error.message);
        return false;
      }

      setSession((current) =>
        current
          ? {
              ...current,
              user: result.data!,
            }
          : current
      );
      setErrorMessage(null);
      return true;
    },
    [service]
  );

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      isLoading,
      errorMessage,
      signInWithPassword,
      signUpWithPassword,
      signInWithOAuth,
      signOut,
      updateProfile,
      clearError: () => setErrorMessage(null),
    }),
    [
      session,
      isLoading,
      errorMessage,
      signInWithPassword,
      signUpWithPassword,
      signInWithOAuth,
      signOut,
      updateProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
