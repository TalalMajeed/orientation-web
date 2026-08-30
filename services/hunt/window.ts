import "server-only";

/**
 * The hunt only accepts scans between 1pm and 8pm on Day 2 of Orientation
 * Week. Day 2's exact date isn't locked in yet (the schedule still says
 * "Coming soon"), so both ends are overridable via env — set
 * HUNT_WINDOW_START / HUNT_WINDOW_END to real ISO datetimes once Day 2 is
 * confirmed. The fallbacks below are placeholders, not real dates.
 */
const DEFAULT_WINDOW_START = "2026-09-02T13:00:00+05:00";
const DEFAULT_WINDOW_END = "2026-09-02T20:00:00+05:00";

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
