import { redirect } from "next/navigation";

// The game is live now — this route used to show the "coming soon, join the
// waitlist" page. Keeping the URL alive as a redirect so old links (the
// homepage popup, anything already shared) still land somewhere useful.
export default function WaitlistPage() {
  redirect("/game");
}
