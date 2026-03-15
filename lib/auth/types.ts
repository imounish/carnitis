export type AuthProvider = "google" | "github" | "apple";

export type AuthErrorCode =
  | "invalid_credentials"
  | "email_already_in_use"
  | "session_not_found"
  | "unauthorized"
  | "network_error"
  | "unknown";

export interface AuthError {
  code: AuthErrorCode;
  message: string;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string;
  user: AuthUser;
}

export interface AuthResult<T> {
  data: T | null;
  error: AuthError | null;
}

export interface AuthProfileUpdateInput {
  displayName?: string;
  avatarUrl?: string | null;
  onboardingCompleted?: boolean;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface SignUpInput {
  email: string;
  password: string;
  displayName: string;
}
