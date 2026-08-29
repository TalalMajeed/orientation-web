"use client";

import { useState } from "react";

const FIELD =
  "w-full rounded-2xl border-2 border-dotted border-fg/25 bg-transparent px-5 py-3 font-mono text-[13px] normal-case tracking-normal text-fg placeholder:text-fg/30 focus:border-fg focus:outline-none disabled:opacity-50";

type Status = "idle" | "loading" | "ok" | "error";

export default function WaitlistForm({ initialCount }: { initialCount: number }) {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [feedback, setFeedback] = useState("");
  const [count, setCount] = useState(initialCount);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setFeedback("");

    try {
      const response = await fetch("/api/v1/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, company }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatus("error");
        setFeedback(data.error || "Couldn't join the waitlist. Please try again.");
        return;
      }

      setStatus("ok");
      setFeedback(data.message || "You're on the waitlist.");
      if (typeof data.count === "number") setCount(data.count);
      setEmail("");
    } catch {
      setStatus("error");
      setFeedback("Network error. Please try again.");
    }
  }

  const sending = status === "loading";

  return (
    <form onSubmit={handleSubmit} className="mt-8 w-full max-w-md space-y-3 text-left">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg/45">
        {count.toLocaleString()} {count === 1 ? "person" : "people"} already on the waitlist
      </p>
      <input
        required
        type="email"
        maxLength={200}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        disabled={sending}
        placeholder="you@email.com"
        className={FIELD}
        autoComplete="email"
      />
      {/* Hidden from real visitors via CSS + tab order; left blank by people, filled by bots. */}
      <input
        type="text"
        value={company}
        onChange={(event) => setCompany(event.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute h-0 w-0 opacity-0"
      />
      <button
        type="submit"
        disabled={sending}
        className="cursor-pointer rounded-full border-2 border-transparent bg-fg px-6 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-surface transition-colors hover:bg-ember hover:text-cream disabled:cursor-not-allowed disabled:opacity-50"
      >
        {sending ? "Joining…" : "Join waitlist"}
      </button>
      {feedback && (
        <p
          aria-live="polite"
          className={`font-italic text-sm italic ${
            status === "ok" ? "text-fg/70" : "text-danger"
          }`}
        >
          {feedback}
        </p>
      )}
    </form>
  );
}
