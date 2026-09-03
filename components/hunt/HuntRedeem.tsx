"use client";

import { useCallback, useEffect, useState } from "react";

import { HUNT_HOUSES } from "@/services/hunt/houses";

type Phase =
  | "loading"
  | "not_found"
  | "not_started"
  | "ended"
  | "already_scanned"
  | "cooldown"
  | "available"
  | "captured"
  | "error";

const GROUPS = [1, 2, 3, 4, 5, 6, 7];
const DEVICE_ID_KEY = "hunt.deviceId";

function countdown(availableAt: string): string {
  const ms = new Date(availableAt).getTime() - Date.now();

  if (ms <= 0) return "any moment now";

  const mins = Math.floor(ms / 60_000);
  const secs = Math.floor((ms % 60_000) / 1000);

  return `${mins}m ${secs.toString().padStart(2, "0")}s`;
}

// Cooldown length scales with how many times a code has been found, so this
// reads it off the timestamp the server actually set rather than assuming a
// fixed duration.
function cooldownMinutesLabel(availableAt: string): string {
  const mins = Math.max(1, Math.round((new Date(availableAt).getTime() - Date.now()) / 60_000));

  return `${mins} minute${mins === 1 ? "" : "s"}`;
}

const chevron = (
  <svg
    aria-hidden
    viewBox="0 0 12 12"
    className="pointer-events-none absolute right-4 top-1/2 h-2.5 w-2.5 -translate-y-1/2 text-fg/50"
  >
    <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function HuntRedeem({ code }: { code: string }) {
  const [deviceId, setDeviceId] = useState("");
  const [phase, setPhase] = useState<Phase>("loading");
  const [availableAt, setAvailableAt] = useState<string | null>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [houseName, setHouseName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [, forceTick] = useState(0);

  const [name, setName] = useState("");
  const [houseId, setHouseId] = useState("");
  const [group, setGroup] = useState("");

  // A device that already found this code should never see "on cooldown"
  // and be told to wait it out — every device gets one shot per code.
  useEffect(() => {
    try {
      const existing = window.localStorage.getItem(DEVICE_ID_KEY);

      if (existing) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDeviceId(existing);
        return;
      }

      const id = crypto.randomUUID();

      window.localStorage.setItem(DEVICE_ID_KEY, id);
      setDeviceId(id);
    } catch {
      setDeviceId(crypto.randomUUID());
    }
  }, []);

  const checkStatus = useCallback(async () => {
    const response = await fetch(`/api/v1/hunt/redeem/${code}?deviceId=${encodeURIComponent(deviceId)}`);
    const data = await response.json().catch(() => ({}));

    setLabel(data.label ?? null);

    if (
      data.status === "not_found" ||
      data.status === "not_started" ||
      data.status === "ended" ||
      data.status === "already_scanned"
    ) {
      setPhase(data.status);
      return;
    }

    if (data.status === "cooldown") {
      setAvailableAt(data.availableAt);
      setPhase("cooldown");
      return;
    }

    setPhase("available");
  }, [code, deviceId]);

  useEffect(() => {
    if (!deviceId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial status check once the device id is ready
    checkStatus();
  }, [checkStatus, deviceId]);

  // Live countdown while on cooldown, then flip to available automatically.
  // Safe to do locally without re-checking the server: a device only ever
  // lands on "cooldown" (rather than "already_scanned") when it has not
  // captured this code itself, so once the timer clears it really is available.
  useEffect(() => {
    if (phase !== "cooldown" || !availableAt) return;

    const interval = setInterval(() => {
      if (new Date(availableAt).getTime() <= Date.now()) {
        setPhase("available");
      } else {
        forceTick((t) => t + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, availableAt]);

  async function handleSubmit(submitEvent: React.FormEvent) {
    submitEvent.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const response = await fetch(`/api/v1/hunt/redeem/${code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          name: name.trim(),
          houseId,
          group: Number(group),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 404) {
        setPhase("not_found");
        return;
      }

      if (!response.ok) {
        setFormError(typeof data.error === "string" ? data.error : "Something went wrong");
        return;
      }

      if (data.result === "cooldown") {
        // Someone else just captured it in the race between page-load and submit.
        setAvailableAt(data.availableAt);
        setPhase("cooldown");
        return;
      }

      if (data.result === "already_scanned" || data.result === "not_started" || data.result === "ended") {
        setPhase(data.result);
        return;
      }

      if (data.result === "captured") {
        setHouseName(data.houseName ?? HUNT_HOUSES.find((h) => h.id === houseId)?.name ?? null);
        setAvailableAt(data.availableAt ?? null);
        setPhase("captured");
        return;
      }

      setPhase("error");
    } catch {
      setPhase("error");
    } finally {
      setSubmitting(false);
    }
  }

  // Top-aligned, not vertically centered — the "available" phase renders a
  // three-field form, which would push the heading off-screen above a short
  // phone viewport if this were centered instead.
  const shell = (children: React.ReactNode) => (
    <main className="flex min-h-screen w-full justify-center bg-surface px-6 py-12 text-fg">
      <div className="w-full max-w-sm text-center">
        <p className="font-italic text-sm italic text-fg/50">— NUST Orientation &apos;26</p>
        <h1 className="mt-2 font-serif text-5xl font-bold leading-none text-fg">Scavenger Hunt</h1>
        {children}
      </div>
    </main>
  );

  if (phase === "loading") {
    return shell(
      <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.14em] text-fg/50">Checking code…</p>
    );
  }

  if (phase === "not_found") {
    return shell(
      <div className="mt-8 rounded-2xl border border-dashed border-ember/50 bg-ember/[0.06] p-6">
        <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-ember">Code not found</p>
        <p className="mt-2 font-mono text-[11px] leading-relaxed text-fg/60">
          This QR doesn&apos;t match a live hunt code. Ask a Hunt team member if you think that&apos;s wrong.
        </p>
      </div>
    );
  }

  if (phase === "not_started") {
    return shell(
      <div className="mt-8 rounded-2xl border border-dashed border-fg/25 p-6">
        <p className="font-serif text-2xl font-bold text-fg">Game has not started</p>
        <p className="mt-3 font-mono text-[11px] leading-relaxed text-fg/50">
          The hunt opens at 1 PM on Day 2 of Orientation Week. Come back and scan again then!
        </p>
      </div>
    );
  }

  if (phase === "ended") {
    return shell(
      <div className="mt-8 rounded-2xl border border-dashed border-fg/25 p-6">
        <p className="font-serif text-2xl font-bold text-fg">Game has ended</p>
        <p className="mt-3 font-mono text-[11px] leading-relaxed text-fg/50">
          The hunt closed at 8 PM. Check the leaderboard to see how your house did!
        </p>
      </div>
    );
  }

  if (phase === "already_scanned") {
    return shell(
      <div className="mt-8 rounded-2xl border border-dashed border-ember/50 bg-ember/[0.06] p-6">
        <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-ember">QR code already scanned</p>
        <p className="mt-2 font-mono text-[11px] leading-relaxed text-fg/60">
          This device already captured this spot. Go find another one!
        </p>
      </div>
    );
  }

  if (phase === "error") {
    return shell(
      <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.1em] text-ember">
        Something went wrong. Try scanning again.
      </p>
    );
  }

  if (phase === "cooldown") {
    return shell(
      <>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ember">QR code on cooldown</p>
        <div className="mt-8 rounded-2xl border border-dashed border-fg/25 p-6">
          <p className="font-serif text-2xl font-bold text-fg">Already found!</p>
          <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.08em] text-fg/50">
            Available again in
          </p>
          <p className="mt-1 font-mono text-3xl font-bold tabular-nums text-ember">
            {availableAt ? countdown(availableAt) : "—"}
          </p>
        </div>
      </>
    );
  }

  if (phase === "captured") {
    return shell(
      <div className="mt-8 rounded-2xl border border-sky/40 bg-sky/10 p-6">
        <p className="font-serif text-3xl font-bold text-fg">Captured! ✓</p>
        <p className="mt-3 font-mono text-[13px] uppercase tracking-[0.1em] text-fg">
          +1 point for <span className="text-sky">{houseName}</span>
        </p>
        <p className="mt-3 font-mono text-[11px] leading-relaxed text-fg/50">
          This spot is on cooldown for{" "}
          {availableAt ? cooldownMinutesLabel(availableAt) : "a bit"} now — go find the next one!
        </p>
      </div>
    );
  }

  // available
  const canSubmit = name.trim().length > 0 && houseId !== "" && group !== "";
  const field =
    "mt-2 w-full rounded-full border-2 border-dotted border-fg/25 bg-transparent px-5 py-3 font-mono text-[13px] normal-case tracking-normal text-fg placeholder:text-fg/30 focus:border-fg focus:outline-none";
  const selectField = `${field} cursor-pointer appearance-none pr-10`;
  const label_ = "block font-mono text-[11px] uppercase tracking-[0.14em] text-fg/60";

  return shell(
    <>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-fg/50">
        {label ?? "You found it!"}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3 text-left">
        <label className={label_}>
          Your name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className={field}
          />
        </label>

        <label className={label_}>
          House
          <div className="relative">
            <select
              required
              value={houseId}
              onChange={(e) => setHouseId(e.target.value)}
              className={selectField}
            >
              <option value="" disabled>
                Select your house
              </option>
              {HUNT_HOUSES.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
            {chevron}
          </div>
        </label>

        <label className={label_}>
          Group
          <div className="relative">
            <select
              required
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              className={selectField}
            >
              <option value="" disabled>
                Select your group
              </option>
              {GROUPS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            {chevron}
          </div>
        </label>

        {formError && (
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ember">{formError}</p>
        )}

        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="w-full cursor-pointer rounded-full bg-ember px-6 py-3 font-mono text-[12px] uppercase tracking-[0.16em] text-cream transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Capturing…" : "Capture this spot"}
        </button>
      </form>
    </>
  );
}
