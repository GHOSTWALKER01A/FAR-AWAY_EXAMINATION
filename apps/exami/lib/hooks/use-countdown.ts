"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A server-authoritative countdown.
 * Seed it with `remainingSeconds` from the backend; call `sync()` on each
 * heartbeat to re-anchor. The local tick is only cosmetic between syncs.
 */
export function useCountdown(initialSeconds: number) {
  const [remaining, setRemaining] = useState(initialSeconds);
  // Target wall-clock time the countdown reaches zero. Set in effects, never
  // during render (Date.now() is impure).
  const target = useRef<number>(0);

  useEffect(() => {
    target.current = Date.now() + initialSeconds * 1000;
    const id = setInterval(() => {
      const secs = Math.max(
        0,
        Math.round((target.current - Date.now()) / 1000),
      );
      setRemaining(secs);
    }, 250);
    return () => clearInterval(id);
  }, [initialSeconds]);

  /** Re-anchor the countdown to the server's authoritative remaining seconds. */
  const sync = (serverRemaining: number) => {
    target.current = Date.now() + serverRemaining * 1000;
    setRemaining(serverRemaining);
  };

  return { remaining, sync };
}
