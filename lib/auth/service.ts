import type {
  AuthProfileUpdateInput,
  AuthProvider,
  AuthResult,
  AuthSession,
  AuthUser,
  SignInInput,
  SignUpInput,
} from "@/lib/auth/types";

export interface AuthService {
  signInWithPassword(input: SignInInput): Promise<AuthResult<AuthSession>>;
  signUpWithPassword(input: SignUpInput): Promise<AuthResult<AuthSession>>;
  signInWithOAuth(provider: AuthProvider): Promise<AuthResult<AuthSession>>;
  signOut(): Promise<AuthResult<true>>;
  getSession(): Promise<AuthResult<AuthSession>>;
  updateProfile(input: AuthProfileUpdateInput): Promise<AuthResult<AuthUser>>;
}
