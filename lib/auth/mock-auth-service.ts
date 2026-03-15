import type { AuthService } from "@/lib/auth/service";
import {
  clearStoredSession,
  getUsersStorageKey,
  loadStoredSession,
  saveStoredSession,
} from "@/lib/auth/session";
import type {
  AuthProfileUpdateInput,
  AuthProvider,
  AuthResult,
  AuthSession,
  AuthUser,
  SignInInput,
  SignUpInput,
} from "@/lib/auth/types";

interface MockUserRecord {
  id: string;
  email: string;
  password: string;
  displayName: string;
  avatarUrl: string | null;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

const DEMO_USER: MockUserRecord = {
  id: "usr-demo-1",
  email: "demo@garagelog.app",
  password: "demo12345",
  displayName: "Demo Driver",
  avatarUrl: null,
  onboardingCompleted: true,
  createdAt: "2026-03-01T00:00:00.000Z",
  updatedAt: "2026-03-01T00:00:00.000Z",
};

function delay(ms = 120): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function randomToken(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

function toAuthUser(record: MockUserRecord): AuthUser {
  return {
    id: record.id,
    email: record.email,
    displayName: record.displayName,
    avatarUrl: record.avatarUrl,
    onboardingCompleted: record.onboardingCompleted,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function loadUsers(): MockUserRecord[] {
  if (!isBrowser()) return [DEMO_USER];

  const raw = window.localStorage.getItem(getUsersStorageKey());
  if (!raw) {
    window.localStorage.setItem(getUsersStorageKey(), JSON.stringify([DEMO_USER]));
    return [DEMO_USER];
  }

  try {
    const parsed = JSON.parse(raw) as MockUserRecord[];
    if (parsed.length < 1) {
      window.localStorage.setItem(getUsersStorageKey(), JSON.stringify([DEMO_USER]));
      return [DEMO_USER];
    }
    return parsed;
  } catch {
    window.localStorage.setItem(getUsersStorageKey(), JSON.stringify([DEMO_USER]));
    return [DEMO_USER];
  }
}

function saveUsers(users: MockUserRecord[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(getUsersStorageKey(), JSON.stringify(users));
}

function createSession(user: AuthUser): AuthSession {
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString();
  return {
    accessToken: randomToken("mock-access"),
    refreshToken: randomToken("mock-refresh"),
    expiresAt,
    user,
  };
}

function ok<T>(data: T): AuthResult<T> {
  return { data, error: null };
}

function fail<T>(
  code: AuthResult<T>["error"] extends infer E
    ? E extends { code: infer C }
      ? C
      : never
    : never,
  message: string
): AuthResult<T> {
  return {
    data: null,
    error: {
      code,
      message,
    },
  };
}

export class MockAuthService implements AuthService {
  async signInWithPassword(input: SignInInput): Promise<AuthResult<AuthSession>> {
    await delay();
    const users = loadUsers();
    const user = users.find(
      (candidate) =>
        candidate.email.toLowerCase() === input.email.trim().toLowerCase() &&
        candidate.password === input.password
    );

    if (!user) {
      return fail("invalid_credentials", "Invalid email or password.");
    }

    const session = createSession(toAuthUser(user));
    saveStoredSession(session);
    return ok(session);
  }

  async signUpWithPassword(input: SignUpInput): Promise<AuthResult<AuthSession>> {
    await delay();
    const users = loadUsers();
    const email = input.email.trim().toLowerCase();

    const existing = users.find((candidate) => candidate.email.toLowerCase() === email);
    if (existing) {
      return fail("email_already_in_use", "An account already exists for this email.");
    }

    const now = new Date().toISOString();
    const nextUser: MockUserRecord = {
      id: randomToken("usr"),
      email,
      password: input.password,
      displayName: input.displayName.trim(),
      avatarUrl: null,
      onboardingCompleted: false,
      createdAt: now,
      updatedAt: now,
    };

    const nextUsers = [nextUser, ...users];
    saveUsers(nextUsers);

    const session = createSession(toAuthUser(nextUser));
    saveStoredSession(session);
    return ok(session);
  }

  async signInWithOAuth(provider: AuthProvider): Promise<AuthResult<AuthSession>> {
    await delay();

    const users = loadUsers();
    const email = `${provider}.user@garagelog.app`;
    const now = new Date().toISOString();

    let oauthUser = users.find((candidate) => candidate.email === email);

    if (!oauthUser) {
      oauthUser = {
        id: randomToken("usr"),
        email,
        password: randomToken("oauth"),
        displayName: `${provider[0].toUpperCase()}${provider.slice(1)} User`,
        avatarUrl: null,
        onboardingCompleted: false,
        createdAt: now,
        updatedAt: now,
      };
      saveUsers([oauthUser, ...users]);
    }

    const session = createSession(toAuthUser(oauthUser));
    saveStoredSession(session);

    return ok(session);
  }

  async signOut(): Promise<AuthResult<true>> {
    await delay(60);
    clearStoredSession();
    return ok(true);
  }

  async getSession(): Promise<AuthResult<AuthSession>> {
    await delay(40);

    const session = loadStoredSession();
    if (!session) {
      return fail("session_not_found", "No active session found.");
    }

    return ok(session);
  }

  async updateProfile(
    input: AuthProfileUpdateInput
  ): Promise<AuthResult<AuthUser>> {
    await delay();

    const session = loadStoredSession();
    if (!session) {
      return fail("unauthorized", "You need to sign in first.");
    }

    const users = loadUsers();
    const userIndex = users.findIndex((candidate) => candidate.id === session.user.id);
    if (userIndex < 0) {
      return fail("unauthorized", "Your account could not be found.");
    }

    const current = users[userIndex];
    const next: MockUserRecord = {
      ...current,
      displayName: input.displayName?.trim() || current.displayName,
      avatarUrl: input.avatarUrl === undefined ? current.avatarUrl : input.avatarUrl,
      onboardingCompleted:
        input.onboardingCompleted === undefined
          ? current.onboardingCompleted
          : input.onboardingCompleted,
      updatedAt: new Date().toISOString(),
    };

    const nextUsers = [...users];
    nextUsers[userIndex] = next;
    saveUsers(nextUsers);

    const nextUser = toAuthUser(next);
    const nextSession: AuthSession = {
      ...session,
      user: nextUser,
    };
    saveStoredSession(nextSession);

    return ok(nextUser);
  }
}
