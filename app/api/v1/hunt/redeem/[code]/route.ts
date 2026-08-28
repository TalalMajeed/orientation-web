import { NextRequest, NextResponse } from "next/server";

import { getCodeStatus, redeemCode } from "@/services/hunt/redeem";

type RouteContext = { params: Promise<{ code: string }> };

// Public — this is exactly what a student's phone hits after scanning the QR.
// No staff session involved; the only "auth" is having physically found the
// code, same as an event ticket's QR.

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { code } = await params;
  const deviceId = request.nextUrl.searchParams.get("deviceId")?.trim() ?? "";
  const status = await getCodeStatus(code.trim().toUpperCase(), deviceId);

  return NextResponse.json(status, { status: 200 });
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { code } = await params;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const fields = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};

  const deviceId = typeof fields.deviceId === "string" ? fields.deviceId.trim() : "";
  const name = typeof fields.name === "string" ? fields.name.trim() : "";
  const houseId = typeof fields.houseId === "string" ? fields.houseId : "";
  const group = typeof fields.group === "number" ? fields.group : Number(fields.group);

  if (!deviceId) {
    return NextResponse.json({ error: "Missing device id" }, { status: 400 });
  }

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (!houseId) {
    return NextResponse.json({ error: "A house is required" }, { status: 400 });
  }

  if (!Number.isInteger(group) || group < 1 || group > 7) {
    return NextResponse.json({ error: "Group must be between 1 and 7" }, { status: 400 });
  }

  const result = await redeemCode(code.trim().toUpperCase(), deviceId, name, houseId, group);

  if (result.result === "invalid_house") {
    return NextResponse.json({ error: "Unknown house" }, { status: 400 });
  }

  if (result.result === "not_found") {
    return NextResponse.json({ error: "Code not found" }, { status: 404 });
  }

  return NextResponse.json(result, { status: 200 });
}
