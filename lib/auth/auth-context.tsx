"use client";

import * as React from "react";
import type { AuthService } from "@/lib/auth/service";
import { MockAuthService } from "@/lib/auth/mock-auth-service";
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
  signOut: () => Promise<void>;
  updateProfile: (input: AuthProfileUpdateInput) => Promise<boolean>;
  clearError: () => void;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [service] = React.useState<AuthService>(() => new MockAuthService());
  const [session, setSession] = React.useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const result = await service.getSession();
      if (!mounted) return;

      if (result.data) {
        setSession(result.data);
      } else {
        setSession(null);
      }

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

  const signOut = React.useCallback(async (): Promise<void> => {
    await service.signOut();
    setSession(null);
    setErrorMessage(null);
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
