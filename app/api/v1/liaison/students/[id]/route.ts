import { NextRequest } from "next/server";

import { requireRole } from "@/services/auth/guard";
import { updateStudent } from "@/services/liaison/db";
import { stateResponse, validationError } from "@/services/liaison/respond";
import { parseStudentPatch, readJsonBody } from "@/services/liaison/validate";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const denied = requireRole(request, "liaison", "admin");

  if (denied) {
    return denied;
  }

  const { id } = await params;

  try {
    const patch = parseStudentPatch(await readJsonBody(request));

    return stateResponse(await updateStudent(id, patch));
  } catch (error) {
    return validationError(error);
  }
}
