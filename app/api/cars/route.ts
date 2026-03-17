import { NextResponse } from "next/server";
import {
  getCarsApiErrorPayload,
  getInvalidCarsPayloadErrorPayload,
  getUnauthorizedCarsErrorPayload,
  parseCreateCarPayload,
} from "@/lib/db/cars-api";
import { getAuthSessionFromHeaders } from "@/lib/auth/server-session";
import { getServerDataAccessFromHeaders } from "@/lib/db/server";

export async function POST(request: Request) {
  const session = await getAuthSessionFromHeaders(request.headers);

  if (!session) {
    const response = getUnauthorizedCarsErrorPayload();
    return NextResponse.json(response.body, { status: response.status });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    const response = getInvalidCarsPayloadErrorPayload();
    return NextResponse.json(response.body, { status: response.status });
  }

  const parsed = parseCreateCarPayload(payload);
  if (!parsed.success) {
    const response = getInvalidCarsPayloadErrorPayload();
    return NextResponse.json(response.body, { status: response.status });
  }

  try {
    const dataAccess = await getServerDataAccessFromHeaders(request.headers);
    const car = await dataAccess.cars.create(parsed.data);

    return NextResponse.json(
      {
        data: {
          id: car.id,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const response = getCarsApiErrorPayload(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
