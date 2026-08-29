"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import WaitlistForm from "@/components/section/waitlist-form";

// Safety net only — reveals as soon as the poster loads (usually instant,
// since the homepage popup already cached the same file), and never blocks
// longer than this even if load/error somehow never fires.
const MAX_WAIT_MS = 900;

export default function WaitlistReveal({ count }: { count: number }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), MAX_WAIT_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className={`transition-opacity duration-300 ${ready ? "opacity-100" : "opacity-0"}`}>
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-[minmax(0,620px)_1fr] sm:items-center sm:gap-16">
        <div className="relative mx-auto aspect-[3/4] w-full max-w-[420px] overflow-hidden rounded-[28px] shadow-2xl sm:mx-0 sm:max-w-none">
          <Image
            src="/game-poster.png"
            alt="Orientation game announcement poster"
            fill
            sizes="(min-width: 640px) 620px, 420px"
            className="object-cover"
            priority
            onLoad={() => setReady(true)}
            onError={() => setReady(true)}
          />
        </div>

        <div>
          <p className="font-italic text-sm italic text-fg/50">— Coming soon</p>
          <h1 className="mt-4 font-serif text-4xl font-bold leading-[0.9] text-fg sm:text-5xl">
            Join the waitlist
          </h1>
          <p className="mt-6 max-w-xl font-serif text-xl leading-[1.3] text-fg sm:text-2xl">
            A new game is coming to NUST Orientation Week. Leave your email and
            we&apos;ll let you know the moment it&apos;s live.
          </p>

          <WaitlistForm initialCount={count} />
        </div>
      </div>
    </div>
  );
}
