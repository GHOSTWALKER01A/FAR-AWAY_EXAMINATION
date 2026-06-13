import { get, post, patch, del } from "./client";
import type { Exam, ExamSection, ExamQuestion, Paginated, ExamStatus, ExamMode } from "@/lib/types";

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
  registrationType: "PRE_REGISTERED" | "OPEN";
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
  list: (params?: ExamListParams) =>
    get<Paginated<Exam>>("/exams", params),

  get: (id: string) =>
    get<Exam>(`/exams/${id}`),

  create: (input: CreateExamInput) =>
    post<Exam>("/exams", input),

  update: (id: string, input: Partial<CreateExamInput>) =>
    patch<Exam>(`/exams/${id}`, input),

  publish: (id: string, publishAt?: string) =>
    post<Exam>(`/exams/${id}/publish`, publishAt ? { publishAt } : {}),

  close: (id: string) =>
    post<Exam>(`/exams/${id}/close`, {}),
};

// ── Exam sections ─────────────────────────────────────────────────────────────
export const sectionsApi = {
  list: (examId: string) =>
    get<ExamSection[]>(`/exams/${examId}/sections`),

  create: (examId: string, input: { title: string; order: number; durationSeconds?: number }) =>
    post<ExamSection>(`/exams/${examId}/sections`, input),

  update: (examId: string, sectionId: string, input: Partial<{ title: string; order: number; durationSeconds: number }>) =>
    patch<ExamSection>(`/exams/${examId}/sections/${sectionId}`, input),

  remove: (examId: string, sectionId: string) =>
    del<{ deleted: boolean }>(`/exams/${examId}/sections/${sectionId}`),
};

// ── Exam questions (attach / detach from exam) ────────────────────────────────
export interface AttachQuestionInput {
  questionId: string;
  order: number;
  weight?: number;
  sectionId?: string;
}

export const examQuestionsApi = {
  list: (examId: string) =>
    get<ExamQuestion[]>(`/exams/${examId}/questions`),

  attach: (examId: string, input: AttachQuestionInput) =>
    post<ExamQuestion>(`/exams/${examId}/questions`, input),

  detach: (examId: string, questionId: string) =>
    del<{ detached: boolean }>(`/exams/${examId}/questions/${questionId}`),

  reorder: (examId: string, items: { questionId: string; order: number }[]) =>
    post<{ updated: number }>(`/exams/${examId}/questions/reorder`, { items }),
};
