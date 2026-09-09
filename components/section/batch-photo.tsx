"use client";

import { useState } from "react";

interface BatchVariant {
  key: "day" | "night";
  label: string;
  src: string;
  dark?: boolean;
  downloadUrl?: string;
  paragraphs: string[];
}

// Dropbox share links default to `dl=0` (opens a preview page) — force the
// direct-download variant regardless of what's stored.
function toDirectDownload(url: string): string {
  return url.includes("dl=0") ? url.replace("dl=0", "dl=1") : `${url}${url.includes("?") ? "&" : "?"}dl=1`;
}

const VARIANTS: BatchVariant[] = [
  {
    key: "day",
    label: "Day",
    src: "/batch-photo-day.jpg",
    downloadUrl:
      "https://www.dropbox.com/scl/fi/qmun91qegdau4x8mjpk7k/BATCH-PHOTO-DAY-EDITED-DISPLAY.jpg?rlkey=nk1u0ujm1cnb1wd4r9yjgh2jx&st=6dpxqkqd&dl=0",
    paragraphs: [
      "Morning light has this way about barring honesty under a blanket of endless blue. Here it paints a crowd of thousands into proof, into evidence of a promise.",
      "Pyare freshies, here's your mirror from above, your ocean of a batch finally sitting still long enough to be seen in the full, brutal, loving candor of the sun. We hope you bask in it for all four (to five) years to come.",
      "No single frame could hold all of you, so we didn't ask it to. A hundred and fifteen pictures woven patiently over the labour of hours, thread by thread, until every face finds its place in the light, because a voyage this size reckons a portrait wide enough to cradle its entirety.",
    ],
  },
  {
    key: "night",
    label: "Night",
    src: "/batch-photo-night.jpg",
    dark: true,
    downloadUrl:
      "https://www.dropbox.com/scl/fi/pmgkmit9dhove2msk35wu/BATCH-PHOTO-NIGHT-EDITED-DISPLAY.jpg?rlkey=wm0b43xvc02lu5lcmkm71tlgn&st=h71xpmaj&dl=0",
    paragraphs: [
      "Four years from now, some of these faces might mean everything to you. Today, some are still strangers. We don't think one photograph can hold the stories of an entire batch, but we tried anyway. Here is the Orientation '26 batch photo in its full glory: iridescent and glowing.",
      "115 photographs, carefully stitched together to make sure every freshie has a face in the frame and a place in the whole. A collection of people who walked into NUST with separate journeys are now part of the same picture.",
      "Zoom in, find your face, find your people, and move past the ones you haven't met yet. You never know who the red string of fate has tied you to.",
    ],
  },
];

export default function BatchPhotoSection() {
  const [active, setActive] = useState<"day" | "night">("day");
  const variant = VARIANTS.find((v) => v.key === active) ?? VARIANTS[0];

  return (
    <section id="batch-photo" className="relative overflow-hidden bg-surface px-6 py-28 sm:px-10">
      <div className="relative mx-auto max-w-[1600px]">
        <p className="font-italic text-sm italic text-fg/50">— One frame, whole batch</p>
        <h2 className="mt-4 font-serif text-[16vw] font-bold leading-[0.85] text-fg lg:text-[11vw]">
          The Batch Photo
        </h2>
        <p className="mt-8 max-w-2xl font-mono text-[11px] uppercase leading-relaxed tracking-[0.14em] text-fg/45">
          115 photographs, stitched into one, twice — once by day, once by night. Previews below
          are reduced in size for fast loading; download the full-resolution versions for the
          real thing.
        </p>

        <div className="mt-10 flex flex-wrap gap-3" role="tablist" aria-label="Batch photo, day or night">
          {VARIANTS.map((v) => (
            <button
              key={v.key}
              type="button"
              role="tab"
              aria-selected={v.key === active}
              onClick={() => setActive(v.key)}
              className={`cursor-pointer rounded-full border-2 border-dotted px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
                v.key === active
                  ? "border-transparent bg-fg text-surface"
                  : "border-fg/30 text-fg/60 hover:border-fg hover:text-fg"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="mt-10">
          <div
            className={`relative overflow-hidden rounded-[24px] border border-fg/12 ${variant.dark ? "bg-ink" : "bg-fg/[0.03]"}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={variant.src}
              alt={`NUST Orientation '26 batch photo, taken by ${variant.key}`}
              className="block h-auto w-full"
            />
            <span className="absolute left-4 top-4 rounded-full border border-cream/40 bg-ink/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-cream backdrop-blur-sm">
              {variant.label}
            </span>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-12 lg:gap-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg/40 lg:col-span-3">
              {variant.label} batch photo
            </p>
            <div className="max-w-3xl font-serif text-xl leading-relaxed text-fg/80 lg:col-span-9">
              {variant.paragraphs.map((paragraph, i) => (
                <p key={i} className={i === 0 ? "" : "mt-5"}>
                  {paragraph}
                </p>
              ))}

              {variant.downloadUrl ? (
                <a
                  href={toDirectDownload(variant.downloadUrl)}
                  className="mt-8 inline-flex cursor-pointer rounded-full border-2 border-dotted border-fg/40 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-fg transition-colors hover:border-fg"
                >
                  Download HD — {variant.label}
                </a>
              ) : (
                <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.14em] text-fg/35">
                  HD download coming soon
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
