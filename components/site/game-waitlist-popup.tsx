"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const SEEN_KEY = "ow-game-waitlist-popup";
const MINI_DISMISS_KEY = "ow-game-waitlist-mini-dismissed";
const FULL_DELAY_MS = 2000;
const MINI_DELAY_MS = 1000;

type Variant = "full" | "mini" | null;

export default function GameWaitlistPopup() {
  const [variant, setVariant] = useState<Variant>(null);
  const [timerDone, setTimerDone] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // First-ever visit gets the full reveal; anyone who has already seen it
  // gets a small corner reminder instead — closing that only hides it for
  // the current session, so it comes back next visit.
  useEffect(() => {
    const seen = localStorage.getItem(SEEN_KEY);
    const miniDismissed = sessionStorage.getItem(MINI_DISMISS_KEY);

    if (seen && miniDismissed) return;

    const next: Variant = seen ? "mini" : "full";

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVariant(next);

    let timer: number | undefined;
    const arm = () => {
      timer = window.setTimeout(() => setTimerDone(true), next === "full" ? FULL_DELAY_MS : MINI_DELAY_MS);
    };

    if (document.querySelector("[data-entry-gate]")) {
      window.addEventListener("site:entered", arm, { once: true });
      return () => window.removeEventListener("site:entered", arm);
    }

    arm();
    return () => window.clearTimeout(timer);
  }, []);

  const visible = Boolean(variant) && timerDone && (variant === "mini" || imageReady) && !dismissed;

  useEffect(() => {
    const lock = visible && variant === "full";
    document.body.style.overflow = lock ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible, variant]);

  const dismiss = () => {
    if (variant === "full") {
      localStorage.setItem(SEEN_KEY, "seen");
    } else if (variant === "mini") {
      sessionStorage.setItem(MINI_DISMISS_KEY, "1");
    }
    setDismissed(true);
  };

  if (!variant) return null;

  const cardGradient = "linear-gradient(160deg, #0A1220 0%, #0E1B30 45%, #142744 100%)";

  if (variant === "mini") {
    return (
      <div
        role="dialog"
        aria-label="Game waitlist reminder"
        aria-hidden={!visible}
        className={`fixed bottom-24 right-5 z-[9400] w-[290px] transition-all duration-500 sm:w-[320px] ${
          visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
        }`}
      >
        <div
          className="relative flex gap-3 overflow-hidden rounded-2xl p-3 pr-8 shadow-2xl"
          style={{ background: cardGradient }}
        >
          <button
            type="button"
            onClick={dismiss}
            aria-label="Close"
            className="absolute right-2 top-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-cream/10 text-cream/70 transition hover:bg-cream/20 hover:text-cream"
          >
            &times;
          </button>

          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
            <Image
              src="/game-poster.png"
              alt="Orientation game announcement poster"
              fill
              sizes="64px"
              className="object-cover object-top"
              onLoad={() => setImageReady(true)}
              onError={() => setImageReady(true)}
            />
          </div>

          <div className="flex flex-col justify-center">
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-sky">Coming soon</p>
            <p className="mt-0.5 font-serif text-sm font-bold leading-tight text-cream">
              A new game is coming
            </p>
            <Link
              href="/waitlist"
              onClick={dismiss}
              className="mt-1.5 w-fit font-mono text-[10px] uppercase tracking-[0.14em] text-sky transition hover:text-cream"
            >
              Join waitlist &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Game announcement"
      aria-hidden={!visible}
      onClick={dismiss}
      className={`fixed inset-0 z-[9500] flex items-center justify-center bg-ink/75 px-4 py-8 backdrop-blur-sm transition-opacity duration-500 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className={`relative grid w-full max-w-5xl overflow-hidden rounded-[28px] shadow-2xl transition-all duration-500 sm:grid-cols-2 ${
          visible ? "translate-y-0 scale-100" : "translate-y-3 scale-[0.97]"
        }`}
        style={{ background: cardGradient }}
      >
        <div className="relative aspect-[3/4]">
          <Image
            src="/game-poster.png"
            alt="Orientation game announcement poster"
            fill
            sizes="(min-width: 640px) 45vw, 100vw"
            className="object-cover"
            priority
            onLoad={() => setImageReady(true)}
            onError={() => setImageReady(true)}
          />
        </div>

        <div className="relative flex flex-col justify-center px-8 py-10 sm:px-12 sm:py-14">
          <button
            type="button"
            onClick={dismiss}
            aria-label="Close"
            className="absolute right-5 top-5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-cream/10 text-cream/80 transition hover:bg-cream/20 hover:text-cream"
          >
            &times;
          </button>

          <span className="w-fit rounded-full bg-sky/15 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-sky">
            Coming soon
          </span>

          <h2 className="mt-5 font-serif text-4xl font-bold leading-[0.95] text-cream sm:text-6xl">
            A new game is coming to Orientation
          </h2>
          <p className="mt-4 font-italic text-base italic text-cream/70 sm:text-lg">
            Join the waitlist and be the first to know when it drops.
          </p>

          <Link
            href="/waitlist"
            onClick={dismiss}
            className="mt-8 inline-flex w-fit cursor-pointer items-center justify-center rounded-full bg-ember px-8 py-3.5 font-mono text-[12px] uppercase tracking-[0.16em] text-cream shadow-lg shadow-ember/30 transition hover:brightness-110"
          >
            Join waitlist
          </Link>
        </div>
      </div>
    </div>
  );
}
