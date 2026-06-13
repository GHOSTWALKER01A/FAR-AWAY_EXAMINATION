import { get, post } from "./client";
import type { EvaluationItem } from "@/lib/types";

export const evaluationApi = {
  reviewQueue: (examId: string) =>
    get<EvaluationItem[]>("/evaluations/review-queue", { examId }),

  approve: (id: string) =>
    post<{ ok: boolean }>(`/evaluations/${id}/approve`, {}),

  override: (
    id: string,
    input: {
      awarded: number;
      criteria: {
        criterion: string;
        awarded: number;
        max: number;
        justification?: string;
      }[];
    },
  ) => post<{ ok: boolean }>(`/evaluations/${id}/override`, input),
};
