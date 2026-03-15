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
  const serviceRef = React.useRef<AuthService | null>(null);
  const [session, setSession] = React.useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  if (!serviceRef.current) {
    serviceRef.current = new MockAuthService();
  }

  React.useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const result = await serviceRef.current!.getSession();
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
  }, []);

  const signInWithPassword = React.useCallback(
    async (email: string, password: string): Promise<boolean> => {
      const result = await serviceRef.current!.signInWithPassword({ email, password });
      if (result.error) {
        setErrorMessage(result.error.message);
        return false;
      }

      setSession(result.data);
      setErrorMessage(null);
      return true;
    },
    []
  );

  const signUpWithPassword = React.useCallback(
    async (email: string, password: string, displayName: string): Promise<boolean> => {
      const result = await serviceRef.current!.signUpWithPassword({
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
    []
  );

  const signInWithOAuth = React.useCallback(
    async (provider: AuthProvider): Promise<boolean> => {
      const result = await serviceRef.current!.signInWithOAuth(provider);
      if (result.error) {
        setErrorMessage(result.error.message);
        return false;
      }

      setSession(result.data);
      setErrorMessage(null);
      return true;
    },
    []
  );

  const signOut = React.useCallback(async (): Promise<void> => {
    await serviceRef.current!.signOut();
    setSession(null);
    setErrorMessage(null);
  }, []);

  const updateProfile = React.useCallback(
    async (input: AuthProfileUpdateInput): Promise<boolean> => {
      const result = await serviceRef.current!.updateProfile(input);
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
    []
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
