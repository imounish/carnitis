import { NextResponse } from "next/server";
import { getAuthSessionFromHeaders } from "@/lib/auth/server-session";
import { getServerDataAccessFromHeaders } from "@/lib/db/server";
import {
  buildCreateMaintenanceInput,
  getInvalidMaintenancePayloadErrorPayload,
  getMaintenanceApiErrorPayload,
  getMaintenanceCarNotFoundErrorPayload,
  getUnauthorizedMaintenanceErrorPayload,
  parseCreateMaintenancePayload,
} from "@/lib/db/maintenance-api";

export async function POST(request: Request) {
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

  const parsed = parseCreateMaintenancePayload(payload);
  if (!parsed.success) {
    const response = getInvalidMaintenancePayloadErrorPayload();
    return NextResponse.json(response.body, { status: response.status });
  }

  try {
    const dataAccess = await getServerDataAccessFromHeaders(request.headers);
    const car = await dataAccess.cars.getById(parsed.data.car_id);

    if (!car) {
      const response = getMaintenanceCarNotFoundErrorPayload();
      return NextResponse.json(response.body, { status: response.status });
    }

    const item = await dataAccess.maintenance.create(
      buildCreateMaintenanceInput(parsed.data, car.current_mileage)
    );

    return NextResponse.json(
      {
        data: {
          id: item.id,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const response = getMaintenanceApiErrorPayload(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
