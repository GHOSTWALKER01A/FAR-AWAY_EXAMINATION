"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sessionsApi } from "@/lib/api/sessions";
import { useCountdown } from "@/lib/hooks/use-countdown";
import { useProctorEmitter } from "@/lib/hooks/use-proctor-emitter";
import { getDeviceToken } from "@/lib/utils";
import { toast } from "@/lib/store/toast";

/**
 * Shared exam-session lifecycle: server-authoritative countdown, 12s heartbeat
 * (re-anchors the timer + detects device takeover), proctoring channel, and
 * auto-submit when the server clock hits zero. Used by both the adaptive and
 * full-paper runners so timing behaviour is identical.
 */
export function useExamLifecycle(
  sessionId: string | null,
  initialRemaining: number,
) {
  const router = useRouter();
  const { remaining, sync } = useCountdown(initialRemaining);
  const [online, setOnline] = useState(true);
  const [warn, setWarn] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  useProctorEmitter(sessionId, (m) => setWarn(m));

  useEffect(() => {
    if (!sessionId) return;
    const id = setInterval(async () => {
      try {
        const hb = await sessionsApi.heartbeat(sessionId, getDeviceToken());
        sync(hb.remainingSeconds);
        setOnline(true);
        if (hb.remainingSeconds <= 0) {
          setExpired(true);
          toast.warning("Time is up", "Submitting your exam.");
          await sessionsApi.submit(sessionId);
          router.replace("/exam/submitted");
        }
      } catch (e) {
        const msg = (e as Error).message || "";
        if (msg.toLowerCase().includes("another") || msg.includes("409")) {
          toast.error("Session opened elsewhere", "This device was disconnected.");
          router.replace("/exams");
        } else {
          setOnline(false);
        }
      }
    }, 12000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return { remaining, sync, online, warn, expired };
}
