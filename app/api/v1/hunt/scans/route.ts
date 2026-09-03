import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/services/auth/guard";
import { listScans } from "@/services/hunt/activity";

export async function GET(request: NextRequest) {
  const denied = requireRole(request, "admin", "hunt");

  if (denied) {
    return denied;
  }

  const scans = await listScans();

  return NextResponse.json({ scans }, { status: 200 });
}
