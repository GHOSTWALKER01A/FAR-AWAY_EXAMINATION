import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format an ISO date into a short human label. */
export function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Turn seconds into mm:ss or hh:mm:ss. */
export function fmtClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

/** Generate a reasonably unique idempotency nonce for answer submission. */
export function makeNonce(prefix = "n"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

/** A stable per-browser device token used for single-active-session enforcement. */
export function getDeviceToken(): string {
  if (typeof window === "undefined") return "ssr";
  const KEY = "examfar.deviceToken";
  let t = localStorage.getItem(KEY);
  if (!t) {
    t = makeNonce("dev");
    localStorage.setItem(KEY, t);
  }
  return t;
}

/** Decode a JWT payload without verifying the signature (UI only). */
export function decodeJwt<T = Record<string, unknown>>(token: string): T | null {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json))) as T;
  } catch {
    return null;
  }
}
