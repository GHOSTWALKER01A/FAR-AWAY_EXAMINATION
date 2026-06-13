import { get, post } from "./client";
import type { LiveSession } from "@/lib/types";

export const proctorApi = {
  live: (examId: string) =>
    get<LiveSession[]>("/proctor/live", { examId }),

  flag: (sessionId: string, note: string) =>
    post<{ ok: boolean }>(`/sessions/${sessionId}/flag`, { note }),

  extendTime: (sessionId: string, seconds: number) =>
    post<{ ok: boolean }>(`/sessions/${sessionId}/extend-time`, { seconds }),
};
