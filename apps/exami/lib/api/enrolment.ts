import { get, post, del } from "./client";
import { api } from "./client";
import type { Enrolment } from "@/lib/types";

export const enrolmentApi = {
  importRoster: async (examId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post(`/exams/${examId}/roster`, form);
    return res.data as { created: number; errors: { row: number; error: string }[] };
  },

  selfRegister: (
    examId: string,
    input: { name: string; email: string; phone?: string },
  ) => post<{ status: string }>(`/exams/${examId}/register`, input),

  list: (examId: string) => get<Enrolment[]>(`/exams/${examId}/enrolments`),

  cancel: (examId: string, userId: string) =>
    del<{ ok: boolean }>(`/exams/${examId}/enrolments/${userId}`),
};
