import { NextResponse } from "next/server";
import {
  getCarNotFoundErrorPayload,
  getCarsApiErrorPayload,
  getEmptyCarsUpdatePayloadErrorPayload,
  getInvalidCarsPayloadErrorPayload,
  getUnauthorizedCarsErrorPayload,
  parseUpdateCarPayload,
} from "@/lib/db/cars-api";
import { getAuthSessionFromHeaders } from "@/lib/auth/server-session";
import { getServerDataAccessFromHeaders } from "@/lib/db/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  if (
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    Object.keys(payload).length === 0
  ) {
    const response = getEmptyCarsUpdatePayloadErrorPayload();
    return NextResponse.json(response.body, { status: response.status });
  }

  const parsed = parseUpdateCarPayload(payload);
  if (!parsed.success) {
    const response = getInvalidCarsPayloadErrorPayload();
    return NextResponse.json(response.body, { status: response.status });
  }

  try {
    const { id } = await params;
    const dataAccess = await getServerDataAccessFromHeaders(request.headers);
    const car = await dataAccess.cars.update(id, parsed.data);

    if (!car) {
      const response = getCarNotFoundErrorPayload();
      return NextResponse.json(response.body, { status: response.status });
    }

    return NextResponse.json(
      {
        data: {
          id: car.id,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const response = getCarsApiErrorPayload(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSessionFromHeaders(request.headers);

  if (!session) {
    const response = getUnauthorizedCarsErrorPayload();
    return NextResponse.json(response.body, { status: response.status });
  }

  try {
    const { id } = await params;
    const dataAccess = await getServerDataAccessFromHeaders(request.headers);
    const deleted = await dataAccess.cars.delete(id);

    if (!deleted) {
      const response = getCarNotFoundErrorPayload();
      return NextResponse.json(response.body, { status: response.status });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const response = getCarsApiErrorPayload(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
