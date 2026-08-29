import { NextRequest, NextResponse } from "next/server";

import { getClientIp } from "@/lib/client-ip";
import { readJson, readString } from "@/lib/request";
import { addWaitlistEntry, countWaitlistEntries } from "@/services/waitlist/join";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL = 200;

export async function GET() {
  const count = await countWaitlistEntries();

  return NextResponse.json({ count }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const body = await readJson(request);

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Hidden field real users never fill in; bots that autofill every input do.
  // Pretend to succeed so scripted submissions get no signal to react to.
  if (readString(body, "company")) {
    return NextResponse.json({ message: "You're on the waitlist" }, { status: 201 });
  }

  const email = readString(body, "email").toLowerCase();

  if (!EMAIL_PATTERN.test(email) || email.length > MAX_EMAIL) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  const result = await addWaitlistEntry(email, getClientIp(request));

  if (result.status === "duplicate-ip") {
    return NextResponse.json(
      { error: "This device or network has already joined the waitlist" },
      { status: 409 }
    );
  }

  if (result.status === "duplicate-email") {
    return NextResponse.json(
      { message: "You're already on the waitlist", count: result.count },
      { status: 200 }
    );
  }

  return NextResponse.json({ message: "You're on the waitlist", count: result.count }, { status: 201 });
}
