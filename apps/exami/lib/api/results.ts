import { get, post } from "./client";
import type { ScoreRow, Report, Grievance } from "@/lib/types";

export const resultsApi = {
  publish: (examId: string) =>
    post<{ published: boolean }>(`/exams/${examId}/results/publish`, {}),

  scoreboard: (examId: string) =>
    get<ScoreRow[]>(`/exams/${examId}/scoreboard`),

  report: (sessionId: string) => get<Report>(`/sessions/${sessionId}/report`),

  raiseGrievance: (
    resultId: string,
    input: { questionId: string; reason: string },
  ) => post<Grievance>(`/results/${resultId}/grievance`, input),
};

export const grievanceApi = {
  list: (status?: "OPEN" | "UPHELD" | "REJECTED") =>
    get<Grievance[]>("/grievances", status ? { status } : undefined),

  resolve: (
    id: string,
    input: { upheld: boolean; note?: string; adjustedMarks?: number },
  ) => post<Grievance>(`/grievances/${id}/resolve`, input),
};
