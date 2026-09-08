import Link from "next/link";

import { pageMetadata } from "@/lib/seo";

const GAME_URL = "https://nustgame-jpx3xfrija-ww.a.run.app/";

export const metadata = pageMetadata({
  title: "Play the Game — NUST Orientation '26",
  description: "The official NUST Orientation Week game — play now.",
  path: "/game",
  image: "/game-poster.png",
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
          NUST Orientation Game{" "}
          <span className="hidden text-cream/25 sm:inline">
            · built by{" "}
            <a
              href="https://www.linkedin.com/in/faseeh06/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cream/40 underline decoration-dotted underline-offset-2 transition-colors hover:text-cream"
            >
              Muhammad Faseeh
            </a>{" "}
            &amp;{" "}
            <a
              href="https://www.linkedin.com/in/dev-hamzashah/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cream/40 underline decoration-dotted underline-offset-2 transition-colors hover:text-cream"
            >
              Hamza Shah
            </a>
          </span>
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
