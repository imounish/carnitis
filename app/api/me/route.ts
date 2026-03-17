import { NextResponse } from "next/server";
import { z } from "zod";
import { mapProfileToAuthUser } from "@/lib/auth/auth-mappers";
import { getAuthUserById, updateUserProfile } from "@/lib/auth/profile-store";
import { getAuthSessionFromHeaders } from "@/lib/auth/server-session";

const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(1).optional(),
  avatarUrl: z.string().trim().url().nullable().optional(),
  onboardingCompleted: z.boolean().optional(),
});

function unauthorized() {
  return NextResponse.json(
    {
      error: {
        code: "unauthorized",
        message: "You need to sign in first.",
      },
    },
    { status: 401 }
  );
}

export async function GET(request: Request) {
  const session = await getAuthSessionFromHeaders(request.headers);

  if (!session) {
    return NextResponse.json(
      {
        error: {
          code: "session_not_found",
          message: "No active session found.",
        },
      },
      { status: 401 }
    );
  }

  return NextResponse.json({ data: session });
}

export async function PATCH(request: Request) {
  const session = await getAuthSessionFromHeaders(request.headers);

  if (!session) {
    return unauthorized();
  }

  const payload = await request.json();
  const parsed = profileUpdateSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "unknown",
          message: "Invalid profile update payload.",
        },
      },
      { status: 400 }
    );
  }

  const profile = await updateUserProfile(session.user.id, parsed.data);
  const user = await getAuthUserById(session.user.id);

  if (!user) {
    return unauthorized();
  }

  return NextResponse.json({
    data: mapProfileToAuthUser(user, profile),
  });
}
