"use client";

import { useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";
import { createProctorSocket } from "@/lib/ws/socket";
import { sessionsApi } from "@/lib/api/sessions";
import type { ProctorEvent } from "@/lib/types";

/**
 * Candidate-side proctoring. Connects the WebSocket and wires DOM listeners
 * (tab switch, blur, fullscreen exit, copy/paste). Events emit over WS when
 * connected, otherwise queue and flush via the REST batch endpoint.
 * `onWarn` fires when the server escalates so the UI can show a warning.
 */
export function useProctorEmitter(
  sessionId: string | null,
  onWarn?: (msg: string) => void,
) {
  const socketRef = useRef<Socket | null>(null);
  const connected = useRef(false);
  const queue = useRef<ProctorEvent[]>([]);

  useEffect(() => {
    if (!sessionId) return;

    const socket = createProctorSocket();
    socketRef.current = socket;
    socket.on("connect", () => {
      connected.current = true;
      flush();
    });
    socket.on("disconnect", () => {
      connected.current = false;
    });
    socket.on("proctor:warn", (data: { message?: string }) => {
      onWarn?.(data?.message ?? "Suspicious activity detected. Please stay focused.");
    });

    const emit = (
      type: string,
      severity: number,
      confidence: number,
      payload?: Record<string, unknown>,
    ) => {
      const ev: ProctorEvent = {
        type,
        severity,
        confidence,
        occurredAt: new Date().toISOString(),
        payload,
      };
      if (connected.current) {
        socket.emit("proctor:events", { sessionId, events: [ev] });
      } else {
        queue.current.push(ev);
        if (queue.current.length >= 5) flush();
      }
    };

    const flush = () => {
      if (queue.current.length === 0) return;
      const batch = queue.current.splice(0);
      sessionsApi.events(sessionId, batch).catch(() => {
        // put back on failure
        queue.current.unshift(...batch);
      });
    };

    // DOM signal wiring
    const onVisibility = () => {
      if (document.hidden) emit("TAB_SWITCH", 0.8, 1.0);
    };
    const onBlur = () => emit("WINDOW_BLUR", 0.5, 0.9);
    const onFsChange = () => {
      if (!document.fullscreenElement) emit("FULLSCREEN_EXIT", 0.7, 1.0);
    };
    const onCopy = () => emit("COPY", 0.4, 1.0);
    const onPaste = () => emit("PASTE", 0.6, 1.0);

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);

    const flushInterval = setInterval(flush, 8000);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
      clearInterval(flushInterval);
      flush();
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);
}
