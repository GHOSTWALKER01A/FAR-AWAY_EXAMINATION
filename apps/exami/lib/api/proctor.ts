import { get, post } from "./client";
import type { LiveSession, RiskBucket } from "@/lib/types";

// Shape the backend actually returns for GET /proctor/live
interface RawLiveSession {
  id: string;
  userId: string;
  status: string;
  user: { name: string; email: string };
  riskScore: { score: number; bucket: RiskBucket; breakdown: Record<string, number> } | null;
}

export const proctorApi = {
  /** Returns live sessions for an exam, normalised to LiveSession shape. */
  live: async (examId: string): Promise<LiveSession[]> => {
    const raw = await get<RawLiveSession[]>("/proctor/live", { examId });
    return (raw ?? []).map((s) => ({
      sessionId: s.id,
      userId: s.userId,
      userName: s.user?.name,
      score: s.riskScore?.score ?? 0,
      bucket: s.riskScore?.bucket ?? "LOW",
      latest: [],
      flagged: false,
    }));
  },

  flag: (sessionId: string, note: string) =>
    post<{ ok: true }>(`/sessions/${sessionId}/flag`, { note }),

  extendTime: (sessionId: string, seconds: number) =>
    post<{ newDeadline: string }>(`/sessions/${sessionId}/extend-time`, { seconds }),
};
