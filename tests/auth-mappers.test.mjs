import assert from "node:assert/strict";
import test from "node:test";
import {
  mapBetterAuthErrorCode,
  mapBetterAuthSession,
  mapProfileToAuthUser,
} from "../lib/auth/auth-mappers.ts";

const betterSession = {
  session: {
    token: "session-token",
    expiresAt: new Date("2026-03-20T00:00:00.000Z"),
  },
  user: {
    id: "user-1",
    email: "driver@example.com",
    name: "Driver Name",
    image: "https://example.com/avatar.png",
    createdAt: new Date("2026-03-10T00:00:00.000Z"),
    updatedAt: new Date("2026-03-11T00:00:00.000Z"),
  },
};

const profile = {
  user_id: "user-1",
  display_name: "Garage Driver",
  avatar_url: "https://example.com/profile.png",
  onboarding_completed: true,
  created_at: new Date("2026-03-10T00:00:00.000Z"),
  updated_at: new Date("2026-03-12T00:00:00.000Z"),
};

test("maps the merged Better Auth session into the app auth contract", () => {
  const session = mapBetterAuthSession(betterSession, profile);

  assert.equal(session.accessToken, "session-token");
  assert.equal(session.refreshToken, null);
  assert.equal(session.user.displayName, "Garage Driver");
  assert.equal(session.user.onboardingCompleted, true);
  assert.equal(session.user.avatarUrl, "https://example.com/profile.png");
});

test("maps profile data into the app auth user shape", () => {
  const user = mapProfileToAuthUser(betterSession.user, profile);

  assert.equal(user.email, "driver@example.com");
  assert.equal(user.displayName, "Garage Driver");
  assert.equal(user.updatedAt, "2026-03-12T00:00:00.000Z");
});

test("maps expected Better Auth errors into app auth error codes", () => {
  assert.equal(
    mapBetterAuthErrorCode("Invalid password supplied", 401),
    "invalid_credentials"
  );
  assert.equal(
    mapBetterAuthErrorCode("User already exists", 409),
    "email_already_in_use"
  );
  assert.equal(mapBetterAuthErrorCode("Failed to fetch", 500), "network_error");
});
