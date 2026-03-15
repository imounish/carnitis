import type { AuthSession } from "@/lib/auth/types";

const SESSION_STORAGE_KEY = "carnitis.auth.session.v1";
const USERS_STORAGE_KEY = "carnitis.auth.users.v1";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getSessionStorageKey(): string {
  return SESSION_STORAGE_KEY;
}

export function getUsersStorageKey(): string {
  return USERS_STORAGE_KEY;
}

export function loadStoredSession(): AuthSession | null {
  if (!isBrowser()) return null;

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function saveStoredSession(session: AuthSession): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}
