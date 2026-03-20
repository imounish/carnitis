import { NextResponse } from "next/server";
import {
  getEntriesApiErrorPayload,
  getInvalidEntriesPayloadErrorPayload,
  getUnauthorizedEntriesErrorPayload,
  parseCreateEntryPayload,
} from "@/lib/db/entries-api";
import { getAuthSessionFromHeaders } from "@/lib/auth/server-session";
import { getServerDataAccessFromHeaders } from "@/lib/db/server";

export async function POST(request: Request) {
  const session = await getAuthSessionFromHeaders(request.headers);

  if (!session) {
    const response = getUnauthorizedEntriesErrorPayload();
    return NextResponse.json(response.body, { status: response.status });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    const response = getInvalidEntriesPayloadErrorPayload();
    return NextResponse.json(response.body, { status: response.status });
  }

  const parsed = parseCreateEntryPayload(payload);
  if (!parsed.success) {
    const response = getInvalidEntriesPayloadErrorPayload();
    return NextResponse.json(response.body, { status: response.status });
  }

  try {
    const dataAccess = await getServerDataAccessFromHeaders(request.headers);
    const entry = await dataAccess.entries.create(parsed.data);

    return NextResponse.json(
      {
        data: {
          id: entry.id,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const response = getEntriesApiErrorPayload(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
