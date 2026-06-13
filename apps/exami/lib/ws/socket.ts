"use client";

import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "@/lib/api/client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3000";

/**
 * Create a Socket.IO connection to the proctoring namespace.
 * The JWT is passed in the auth handshake; the gateway authenticates on connect.
 * `examId` (invigilator) joins the exam room; candidates omit it.
 */
export function createProctorSocket(opts?: { examId?: string }): Socket {
  const socket = io(`${WS_URL}/ws/proctor`, {
    transports: ["websocket"],
    auth: { token: getAccessToken() },
    query: opts?.examId ? { examId: opts.examId } : undefined,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });
  return socket;
}
