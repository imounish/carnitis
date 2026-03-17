import assert from "node:assert/strict";
import test from "node:test";
import {
  getAuthPageRedirect,
  getProtectedAppRedirect,
} from "../lib/auth/route-guards.ts";

const completeSession = {
  accessToken: "token",
  refreshToken: null,
  expiresAt: "2026-03-20T00:00:00.000Z",
  user: {
    id: "user-1",
    email: "driver@example.com",
    displayName: "Driver",
    avatarUrl: null,
    onboardingCompleted: true,
    createdAt: "2026-03-10T00:00:00.000Z",
    updatedAt: "2026-03-10T00:00:00.000Z",
  },
};

const onboardingSession = {
  ...completeSession,
  user: {
    ...completeSession.user,
    onboardingCompleted: false,
  },
};

test("protected app routes redirect signed-out users to sign-in", () => {
  assert.equal(getProtectedAppRedirect(null), "/sign-in");
});

test("protected app routes redirect onboarding-incomplete users", () => {
  assert.equal(getProtectedAppRedirect(onboardingSession), "/onboarding");
});

test("auth pages redirect signed-in users to their next destination", () => {
  assert.equal(getAuthPageRedirect(completeSession, "/cars"), "/cars");
});

test("auth pages keep onboarding-incomplete users on the onboarding route", () => {
  assert.equal(getAuthPageRedirect(onboardingSession, "/cars"), "/onboarding");
});
