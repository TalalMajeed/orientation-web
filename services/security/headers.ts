const MAP_TILES = "https://*.tile.openstreetmap.org";
const GAME_ORIGIN = "https://nustgame-jpx3xfrija-ww.a.run.app";
// The game's Firebase Auth sign-in falls back to a frame-based redirect flow
// on browsers that block its sign-in popup (notably mobile Safari) — that
// handler lives on Firebase's own domain, not the game's Cloud Run origin.
const GAME_AUTH_ORIGIN = "https://nust-game.firebaseapp.com";

// React's dev build uses eval() for things like cross-environment stack traces,
// so the dev server needs 'unsafe-eval'. Production never gets it.
const SCRIPT_SRC =
  process.env.NODE_ENV === "production"
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

const CSP_DIRECTIVES = [
  "default-src 'self'",
  SCRIPT_SRC,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https: ${MAP_TILES}`,
  "font-src 'self' data:",
  "media-src 'self'",
  `connect-src 'self' ${MAP_TILES}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  `frame-src 'self' ${GAME_ORIGIN} ${GAME_AUTH_ORIGIN}`,
];

export const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-DNS-Prefetch-Control": "off",
  // 'same-origin' (the default hardening value) severs window.opener between this page and any
  // popup it opens -- including the game's Google sign-in popup, embedded here via the iframe in
  // frame-src below. Firebase's signInWithPopup relies on that reference to detect the popup
  // closing/completing, so with 'same-origin' the popup can render blocked/broken and sign-in
  // never completes. 'same-origin-allow-popups' keeps the same isolation from unrelated windows
  // while letting an explicitly opened popup keep its opener link.
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Permissions-Policy": [
    "camera=()",
    "microphone=()",
    "geolocation=()",
    "payment=()",
    "usb=()",
    "interest-cohort=()",
  ].join(", "),
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

export function contentSecurityPolicy(isSecure: boolean): string {
  const directives = isSecure
    ? [...CSP_DIRECTIVES, "upgrade-insecure-requests"]
    : CSP_DIRECTIVES;

  return directives.join("; ");
}

export function applySecurityHeaders(headers: Headers, isSecure: boolean) {
  headers.set("Content-Security-Policy", contentSecurityPolicy(isSecure));

  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (name === "Strict-Transport-Security" && !isSecure) {
      continue;
    }

    headers.set(name, value);
  }
}
