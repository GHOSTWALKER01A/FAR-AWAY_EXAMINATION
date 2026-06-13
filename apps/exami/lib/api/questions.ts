import { get, post, patch } from "./client";
import { api } from "./client";
import type {
  Question,
  QuestionDraft,
  Difficulty,
  QuestionType,
  CalibrationStatus,
  Paginated,
} from "@/lib/types";

export interface QuestionListParams {
  difficulty?: Difficulty;
  topic?: string;
  type?: QuestionType;
  calibration?: CalibrationStatus;
  page?: number;
  limit?: number;
}

export interface CreateQuestionInput {
  type: QuestionType;
  stem: string;
  options?: { id: string; text: string }[];
  correctKey?: { optionIds?: string[]; value?: number; text?: string };
  marks: number;
  difficulty: Difficulty;
  topicTags?: string[];
  rubric?: { criteria: { criterion: string; max: number }[] };
  irtA?: number;
  irtB?: number;
}

export interface BulkPreviewResult {
  previewId: string;
  total: number;
  valid: number;
  errors: { row: number; error: string }[];
}

export interface AiDraftInput {
  topic: string;
  count: number;
  difficulty: Difficulty;
  type: QuestionType;
  language?: string;
}

export const questionsApi = {
  list: (params?: QuestionListParams) =>
    get<Paginated<Question>>("/questions", params),

  get: (id: string) =>
    get<Question>(`/questions/${id}`),

  create: (input: CreateQuestionInput) =>
    post<Question>("/questions", input),

  update: (id: string, input: Partial<CreateQuestionInput>) =>
    patch<Question>(`/questions/${id}`, input),

  bulkPreview: async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post<{ data: BulkPreviewResult }>("/questions/bulk/preview", form);
    return res.data.data ?? (res.data as unknown as BulkPreviewResult);
  },

  bulkCommit: (previewId: string) =>
    post<{ committed: number }>("/questions/bulk/commit", { previewId }),

  aiDraft: (input: AiDraftInput) =>
    post<{ drafts: QuestionDraft[]; note: string }>("/questions/ai-draft", input),
};
