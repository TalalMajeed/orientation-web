import { redirect } from "next/navigation";

// The game is paused for now — redirecting rather than deleting the iframe
// page so it's a quick revert (undo this redirect) once it's back up.
export default function GamePage() {
  redirect("/game/paused");
}
