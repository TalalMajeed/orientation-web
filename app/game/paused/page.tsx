import Link from "next/link";

import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Game — Be Right Back — NUST Orientation '26",
  description: "The Orientation game is taking a short break.",
  path: "/game/paused",
});

export default function GamePausedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 text-center">
      <p className="font-italic text-sm italic text-cream/50">— NUST Orientation &apos;26</p>
      <h1 className="mt-4 font-serif text-4xl font-bold leading-tight text-cream sm:text-6xl">
        We&apos;ll be right back
      </h1>
      <p className="mt-4 max-w-md font-mono text-sm leading-relaxed text-cream/60">
        Turns out running a campus-wide game costs real money, and we ran a
        little short 😅 — sorting it out, hang tight.
      </p>

      <Link
        href="/"
        className="mt-8 rounded-full border-2 border-dotted border-cream/40 px-6 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-cream transition-colors hover:border-cream"
      >
        ← Back to Orientation
      </Link>
    </main>
  );
}
