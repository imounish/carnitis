import { NextResponse } from "next/server";
import { getAuthSessionFromHeaders } from "@/lib/auth/server-session";
import { getServerDataAccessFromHeaders } from "@/lib/db/server";
import {
  buildUpdateMaintenanceInput,
  getEmptyMaintenanceUpdatePayloadErrorPayload,
  getInvalidMaintenancePayloadErrorPayload,
  getMaintenanceApiErrorPayload,
  getMaintenanceCarNotFoundErrorPayload,
  getMaintenanceNotFoundErrorPayload,
  getUnauthorizedMaintenanceErrorPayload,
  parseUpdateMaintenancePayload,
} from "@/lib/db/maintenance-api";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSessionFromHeaders(request.headers);

  if (!session) {
    const response = getUnauthorizedMaintenanceErrorPayload();
    return NextResponse.json(response.body, { status: response.status });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    const response = getInvalidMaintenancePayloadErrorPayload();
    return NextResponse.json(response.body, { status: response.status });
  }

  if (
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    Object.keys(payload).length === 0
  ) {
    const response = getEmptyMaintenanceUpdatePayloadErrorPayload();
    return NextResponse.json(response.body, { status: response.status });
  }

  const parsed = parseUpdateMaintenancePayload(payload);
  if (!parsed.success) {
    const response = getInvalidMaintenancePayloadErrorPayload();
    return NextResponse.json(response.body, { status: response.status });
  }

  try {
    const { id } = await params;
    const dataAccess = await getServerDataAccessFromHeaders(request.headers);
    const item = await dataAccess.maintenance.getById(id);

    if (!item) {
      const response = getMaintenanceNotFoundErrorPayload();
      return NextResponse.json(response.body, { status: response.status });
    }

    const car = await dataAccess.cars.getById(item.car_id);
    if (!car) {
      const response = getMaintenanceCarNotFoundErrorPayload();
      return NextResponse.json(response.body, { status: response.status });
    }

    const updated = await dataAccess.maintenance.update(
      id,
      buildUpdateMaintenanceInput(parsed.data, item, car.current_mileage)
    );

    if (!updated) {
      const response = getMaintenanceNotFoundErrorPayload();
      return NextResponse.json(response.body, { status: response.status });
    }

    return NextResponse.json(
      {
        data: {
          id: updated.id,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const response = getMaintenanceApiErrorPayload(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSessionFromHeaders(request.headers);

  if (!session) {
    const response = getUnauthorizedMaintenanceErrorPayload();
    return NextResponse.json(response.body, { status: response.status });
  }

  try {
    const { id } = await params;
    const dataAccess = await getServerDataAccessFromHeaders(request.headers);
    const deleted = await dataAccess.maintenance.delete(id);

    if (!deleted) {
      const response = getMaintenanceNotFoundErrorPayload();
      return NextResponse.json(response.body, { status: response.status });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const response = getMaintenanceApiErrorPayload(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
