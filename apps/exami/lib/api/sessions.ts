import { get, post } from "./client";
import type {
  NextItem,
  SessionStart,
  ResumeInfo,
  ProctorEvent,
} from "@/lib/types";

export const sessionsApi = {
  precheck: (
    examId: string,
    input: {
      cameraGranted: boolean;
      networkOk: boolean;
      browserCompatible: boolean;
    },
  ) =>
    post<{
      examLive: boolean;
      cameraRequired: boolean;
      cameraGranted: boolean;
      networkOk: boolean;
      browserCompatible: boolean;
    }>(`/sessions/${examId}/precheck`, input),

  start: (examId: string, deviceToken: string) =>
    post<SessionStart>(`/sessions/${examId}/start`, { deviceToken }),

  resume: (examId: string, deviceToken: string) =>
    post<ResumeInfo>(`/sessions/${examId}/resume`, { deviceToken }),

  nextItem: (sessionId: string) =>
    get<NextItem>(`/sessions/${sessionId}/next-item`),

  answer: (
    sessionId: string,
    input: {
      questionId: string;
      answer: unknown;
      timeSpentMs: number;
      clientNonce: string;
    },
  ) =>
    post<{ accepted: boolean; deduped?: boolean }>(
      `/sessions/${sessionId}/answer`,
      input,
    ),

  heartbeat: (sessionId: string, deviceToken: string) =>
    post<{ remainingSeconds: number }>(`/sessions/${sessionId}/heartbeat`, {
      deviceToken,
    }),

  submit: (sessionId: string) =>
    post<{ submitted: boolean }>(`/sessions/${sessionId}/submit`, {}),

  // REST fallback for proctoring events when the WebSocket is down.
  events: (sessionId: string, events: ProctorEvent[]) =>
    post<{ accepted: number }>(`/sessions/${sessionId}/events`, { events }),
};
