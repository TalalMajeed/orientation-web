import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  SESSION_COOKIE_NAME,
  hasRole,
  verifySessionToken,
} from "@/services/auth/session";
import HuntActivity from "@/components/hunt/HuntActivity";

export default async function HuntActivityPage() {
  const cookieStore = await cookies();
  const session = verifySessionToken(
    cookieStore.get(SESSION_COOKIE_NAME)?.value
  );

  if (!hasRole(session, "admin", "hunt")) {
    redirect("/login?next=/hunt/activity");
  }

  return (
    <main className="min-h-screen bg-surface px-6 py-16 text-fg sm:px-10">
      <div className="mx-auto max-w-6xl">
        <HuntActivity />
      </div>
    </main>
  );
}
