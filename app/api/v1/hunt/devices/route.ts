import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/services/auth/guard";
import { listDevices } from "@/services/hunt/activity";

export async function GET(request: NextRequest) {
  const denied = requireRole(request, "admin", "hunt");

  if (denied) {
    return denied;
  }

  const devices = await listDevices();

  return NextResponse.json({ devices }, { status: 200 });
}
