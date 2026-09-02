import Link from "next/link";

import { pageMetadata } from "@/lib/seo";

const GAME_URL = "https://nustgame-jpx3xfrija-ww.a.run.app/";

export const metadata = pageMetadata({
  title: "Play the Game — NUST Orientation '26",
  description: "The official NUST Orientation Week game — play now.",
  path: "/game",
});

export default function GamePage() {
  return (
    <main className="flex h-screen w-screen flex-col bg-ink">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-cream/10 bg-ink px-4">
        <Link
          href="/"
          className="font-mono text-[11px] uppercase tracking-[0.14em] text-cream/70 transition-colors hover:text-cream"
        >
          &larr; ON&apos;26
        </Link>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-cream/40">
          NUST Orientation Game
        </span>
      </div>

      <iframe
        src={GAME_URL}
        title="NUST Orientation Game"
        className="w-full flex-1 border-0"
        allow="fullscreen; gamepad; autoplay; clipboard-write"
        allowFullScreen
      />
    </main>
  );
}
