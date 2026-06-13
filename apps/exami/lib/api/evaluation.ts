import { get, post } from "./client";
import type { EvaluationItem } from "@/lib/types";

export const evaluationApi = {
  /** Trigger re-grading for all submitted sessions in an exam. */
  run: (examId: string) =>
    post<{ queued: number; message: string }>(`/evaluations/run/${examId}`, {}),

  reviewQueue: (examId: string) =>
    get<EvaluationItem[]>("/evaluations/review-queue", { examId }),

  approve: (id: string) =>
    post<EvaluationItem>(`/evaluations/${id}/approve`, {}),

  override: (id: string, input: {
    awarded: number;
    criteria: { criterion: string; awarded: number; max: number; justification?: string }[];
  }) =>
    post<EvaluationItem>(`/evaluations/${id}/override`, input),
};
