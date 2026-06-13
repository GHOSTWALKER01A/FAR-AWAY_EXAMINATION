import { get, post, patch } from "./client";
import type { Exam, ExamStatus, ExamMode } from "@/lib/types";

export interface ExamListParams {
  status?: ExamStatus;
  mode?: ExamMode;
  page?: number;
  limit?: number;
}

export interface CreateExamInput {
  title: string;
  description?: string;
  mode: ExamMode;
  registrationType: string;
  durationSeconds: number;
  startAt?: string;
  endAt?: string;
  publishAt?: string;
  seatCap?: number;
  markingConfig?: Record<string, unknown>;
  adaptiveConfig?: Record<string, unknown>;
  proctoringConfig?: Record<string, unknown>;
  blueprint?: Record<string, unknown>;
}

export const examsApi = {
  list: (params?: ExamListParams) => get<Exam[]>("/exams", params),
  get: (id: string) => get<Exam>(`/exams/${id}`),
  create: (input: CreateExamInput) => post<Exam>("/exams", input),
  update: (id: string, input: Partial<CreateExamInput>) =>
    patch<Exam>(`/exams/${id}`, input),
  publish: (id: string, publishAt?: string) =>
    post<Exam>(`/exams/${id}/publish`, publishAt ? { publishAt } : {}),
  close: (id: string) => post<Exam>(`/exams/${id}/close`, {}),
};
