"use client";

import { useEffect, useState } from "react";

interface HuntCodeDto {
  id: string;
  code: string;
  label: string | null;
  qrDataUrl: string;
}

type Layout = "1" | "4";

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }

  return chunks;
}

function QrCard({ code, qrSize }: { code: HuntCodeDto; qrSize: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
      <p className="font-serif text-2xl font-bold sm:text-3xl">Here&apos;s the treasure!</p>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-black/60 sm:text-sm">
        Scan to get it
      </p>

      {/* eslint-disable-next-line @next/next/no-img-element -- data URL, no optimization needed */}
      <img src={code.qrDataUrl} alt={code.code} style={{ height: qrSize, width: qrSize }} />

      <p className="font-mono text-base font-bold tracking-[0.15em] sm:text-lg">{code.code}</p>
      {code.label && (
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-black/40">{code.label}</p>
      )}
    </div>
  );
}

export default function HuntPrintSheet() {
  const [codes, setCodes] = useState<HuntCodeDto[] | null>(null);
  const [layout, setLayout] = useState<Layout>("4");

  useEffect(() => {
    fetch("/api/v1/hunt/codes")
      .then((response) => response.json())
      .then((data) => setCodes(data.codes ?? []));
  }, []);

  useEffect(() => {
    if (!codes || codes.length === 0) return;

    // Data-URL images paint synchronously, but give the layout a beat before
    // the print dialog steals focus. Only fires once, on load — toggling the
    // layout afterward doesn't reopen the print dialog on its own.
    const timer = setTimeout(() => window.print(), 500);
    return () => clearTimeout(timer);
  }, [codes]);

  if (!codes) {
    return <p className="p-10 font-mono text-sm text-black/50">Loading codes…</p>;
  }

  if (codes.length === 0) {
    return (
      <p className="p-10 font-mono text-sm text-black/50">
        No codes to print yet — generate a batch first.
      </p>
    );
  }

  return (
    <div className="bg-white text-black">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b border-black/10 bg-white p-6 print:hidden">
        <h1 className="font-serif text-2xl font-bold">
          Scavenger Hunt — {codes.length} sign{codes.length === 1 ? "" : "s"} ({layout} per page)
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-full border border-black/20">
            <button
              onClick={() => setLayout("1")}
              className={`px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
                layout === "1" ? "bg-black text-white" : "bg-white text-black hover:bg-black/5"
              }`}
            >
              1 per page
            </button>
            <button
              onClick={() => setLayout("4")}
              className={`px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
                layout === "4" ? "bg-black text-white" : "bg-white text-black hover:bg-black/5"
              }`}
            >
              4 per page
            </button>
          </div>
          <button
            onClick={() => window.print()}
            className="rounded-full bg-black px-5 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-white"
          >
            Print / Save as PDF
          </button>
          <a
            href="/hunt"
            className="rounded-full border border-black/20 px-5 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-black"
          >
            Back
          </a>
        </div>
      </div>

      {layout === "1" &&
        codes.map((c) => (
          <div
            key={c.id}
            className="hunt-print-page flex min-h-screen flex-col items-center justify-center px-10 py-16"
          >
            <QrCard code={c} qrSize={384} />
          </div>
        ))}

      {layout === "4" &&
        chunk(codes, 4).map((page, pageIndex) => (
          <div
            key={pageIndex}
            className="hunt-print-page grid min-h-screen grid-cols-2 grid-rows-2 gap-6 px-8 py-10"
          >
            {page.map((c) => (
              <div
                key={c.id}
                className="qr-cut-card flex items-center justify-center rounded-2xl border-2 border-dashed border-black/40 p-6"
              >
                <QrCard code={c} qrSize={240} />
              </div>
            ))}
          </div>
        ))}

      <style>{`
        @media print {
          @page { margin: 12mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .hunt-print-page {
            break-after: page;
            break-inside: avoid;
            min-height: auto;
          }
          .hunt-print-page:last-child {
            break-after: auto;
          }
          .qr-cut-card {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
