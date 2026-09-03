import "server-only";

/**
 * The hunt only accepts scans during "OG Activities" on Day 2 of
 * Orientation Week — 3rd Sep, 1pm-7pm (see the real schedule in
 * components/section/schedule.tsx). Still overridable via
 * HUNT_WINDOW_START / HUNT_WINDOW_END if the actual timing shifts.
 */
const DEFAULT_WINDOW_START = "2026-09-03T13:00:00+05:00";
const DEFAULT_WINDOW_END = "2026-09-03T19:00:00+05:00";

export function getHuntWindow(): { start: Date; end: Date } {
  const start = new Date(process.env.HUNT_WINDOW_START || DEFAULT_WINDOW_START);
  const end = new Date(process.env.HUNT_WINDOW_END || DEFAULT_WINDOW_END);

  return { start, end };
}

export type WindowState = "not_started" | "ended" | "open";

export function getWindowState(now: Date = new Date()): WindowState {
  const { start, end } = getHuntWindow();

  if (now < start) {
    return "not_started";
  }

  if (now > end) {
    return "ended";
  }

  return "open";
}
