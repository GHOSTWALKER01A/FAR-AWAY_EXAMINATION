"use client";

import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { createProctorSocket } from "@/lib/ws/socket";
import { proctorApi } from "@/lib/api/proctor";
import type { LiveSession } from "@/lib/types";

type ConnState = "connecting" | "live" | "polling";

/**
 * Invigilator feed: seed from REST, then subscribe to live WS updates.
 * Falls back to polling every 5s while the socket is disconnected.
 */
export function useProctorFeed(examId: string) {
  const [sessions, setSessions] = useState<Record<string, LiveSession>>({});
  const [conn, setConn] = useState<ConnState>("connecting");
  const socketRef = useRef<Socket | null>(null);

  const upsert = (s: LiveSession) =>
    setSessions((prev) => ({ ...prev, [s.sessionId]: { ...prev[s.sessionId], ...s } }));

  // Initial REST seed.
  useEffect(() => {
    let active = true;
    proctorApi
      .live(examId)
      .then((list) => {
        if (!active) return;
        setSessions(Object.fromEntries(list.map((s) => [s.sessionId, s])));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [examId]);

  // WebSocket subscription.
  useEffect(() => {
    const socket = createProctorSocket({ examId });
    socketRef.current = socket;

    socket.on("connect", () => setConn("live"));
    socket.on("disconnect", () => setConn("polling"));
    socket.io.on("reconnect_attempt", () => setConn("connecting"));
    socket.on("proctor:update", (data: LiveSession) => upsert(data));

    return () => {
      socket.off("proctor:update");
      socket.disconnect();
    };
  }, [examId]);

  // Polling fallback while not live.
  useEffect(() => {
    if (conn === "live") return;
    const id = setInterval(() => {
      proctorApi
        .live(examId)
        .then((list) =>
          setSessions(Object.fromEntries(list.map((s) => [s.sessionId, s]))),
        )
        .catch(() => {});
    }, 5000);
    return () => clearInterval(id);
  }, [conn, examId]);

  const sendMessage = (sessionId: string, message: string) => {
    socketRef.current?.emit("invig:message", { sessionId, message });
  };

  // Sorted by risk score descending (highest risk floats to top).
  const list = Object.values(sessions).sort((a, b) => b.score - a.score);

  return { list, conn, sendMessage };
}
