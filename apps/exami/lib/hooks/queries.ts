"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { examsApi, examQuestionsApi, type ExamListParams, type CreateExamInput, type AttachQuestionInput } from "@/lib/api/exams";
import {
  questionsApi,
  type QuestionListParams,
  type CreateQuestionInput,
  type AiDraftInput,
} from "@/lib/api/questions";
import { enrolmentApi } from "@/lib/api/enrolment";
import { evaluationApi } from "@/lib/api/evaluation";
import { resultsApi, grievanceApi } from "@/lib/api/results";
import { proctorApi } from "@/lib/api/proctor";
import { toast } from "@/lib/store/toast";
import type { ApiError } from "@/lib/api/client";

const errMsg = (e: unknown) =>
  (e as ApiError)?.message || "Something went wrong";

/* ----------------------------- Exams ----------------------------- */
// Returns the unwrapped items array so components can do data.map() directly.
// Use useExamsPaginated() if you need total/page metadata.
export const useExams = (params?: ExamListParams) =>
  useQuery({
    queryKey: ["exams", params],
    queryFn: async () => {
      const res = await examsApi.list(params);
      return res.items;
    },
  });

export const useExamsPaginated = (params?: ExamListParams) =>
  useQuery({
    queryKey: ["exams-paginated", params],
    queryFn: () => examsApi.list(params),
  });

export const useExam = (id?: string) =>
  useQuery({
    queryKey: ["exam", id],
    queryFn: () => examsApi.get(id!),
    enabled: !!id,
  });

export const useCreateExam = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateExamInput) => examsApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exams"] });
      toast.success("Exam created", "Saved as draft.");
    },
    onError: (e) => toast.error("Create failed", errMsg(e)),
  });
};

export const useUpdateExam = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CreateExamInput>) =>
      examsApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exam", id] });
      toast.success("Exam updated");
    },
    onError: (e) => toast.error("Update failed", errMsg(e)),
  });
};

export const usePublishExam = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (publishAt?: string) => examsApi.publish(id, publishAt),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exam", id] });
      qc.invalidateQueries({ queryKey: ["exams"] });
      toast.success("Exam published");
    },
    onError: (e) => toast.error("Publish failed", errMsg(e)),
  });
};

export const useCloseExam = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => examsApi.close(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exam", id] });
      toast.success("Exam closed");
    },
    onError: (e) => toast.error("Close failed", errMsg(e)),
  });
};

/* --------------------------- Questions --------------------------- */
export const useQuestions = (params?: QuestionListParams) =>
  useQuery({
    queryKey: ["questions", params],
    queryFn: async () => {
      const res = await questionsApi.list(params);
      return res.items;
    },
  });

export const useCreateQuestion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateQuestionInput) => questionsApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["questions"] });
      toast.success("Question saved");
    },
    onError: (e) => toast.error("Save failed", errMsg(e)),
  });
};

export const useAiDraft = () =>
  useMutation({
    mutationFn: (input: AiDraftInput) => questionsApi.aiDraft(input),
    onError: (e) => toast.error("Generation failed", errMsg(e)),
  });

/* --------------------------- Enrolment --------------------------- */
export const useEnrolments = (examId?: string) =>
  useQuery({
    queryKey: ["enrolments", examId],
    queryFn: () => enrolmentApi.list(examId!),
    enabled: !!examId,
  });

export const useCancelEnrolment = (examId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => enrolmentApi.cancel(examId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["enrolments", examId] });
      toast.success("Enrolment cancelled", "Waitlist promoted if any.");
    },
    onError: (e) => toast.error("Cancel failed", errMsg(e)),
  });
};

/* -------------------------- Evaluation --------------------------- */
export const useReviewQueue = (examId?: string) =>
  useQuery({
    queryKey: ["review-queue", examId],
    queryFn: () => evaluationApi.reviewQueue(examId!),
    enabled: !!examId,
  });

export const useApproveEval = (examId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => evaluationApi.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["review-queue", examId] });
      toast.success("Grade approved");
    },
    onError: (e) => toast.error("Approve failed", errMsg(e)),
  });
};

export const useOverrideEval = (examId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      id: string;
      awarded: number;
      criteria: {
        criterion: string;
        awarded: number;
        max: number;
        justification?: string;
      }[];
    }) =>
      evaluationApi.override(vars.id, {
        awarded: vars.awarded,
        criteria: vars.criteria,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["review-queue", examId] });
      toast.success("Grade overridden");
    },
    onError: (e) => toast.error("Override failed", errMsg(e)),
  });
};

/* ---------------------------- Results ---------------------------- */
export const useScoreboard = (examId?: string) =>
  useQuery({
    queryKey: ["scoreboard", examId],
    queryFn: () => resultsApi.scoreboard(examId!),
    enabled: !!examId,
  });

export const useReport = (sessionId?: string) =>
  useQuery({
    queryKey: ["report", sessionId],
    queryFn: () => resultsApi.report(sessionId!),
    enabled: !!sessionId,
  });

export const usePublishResults = (examId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => resultsApi.publish(examId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scoreboard", examId] });
      qc.invalidateQueries({ queryKey: ["exam", examId] });
      toast.success("Results published");
    },
    onError: (e) => toast.error("Publish failed", errMsg(e)),
  });
};

/* --------------------------- Grievances -------------------------- */
export const useGrievances = (status?: "OPEN" | "UPHELD" | "REJECTED") =>
  useQuery({
    queryKey: ["grievances", status],
    queryFn: () => grievanceApi.list(status),
  });

export const useResolveGrievance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      id: string;
      upheld: boolean;
      note?: string;
      adjustedMarks?: number;
    }) =>
      grievanceApi.resolve(vars.id, {
        upheld: vars.upheld,
        note: vars.note,
        adjustedMarks: vars.adjustedMarks,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grievances"] });
      toast.success("Grievance resolved");
    },
    onError: (e) => toast.error("Resolve failed", errMsg(e)),
  });
};

/* -------------------------- Proctoring --------------------------- */
export const useLiveSessions = (examId?: string, enabled = true) =>
  useQuery({
    queryKey: ["proctor-live", examId],
    queryFn: () => proctorApi.live(examId!),
    enabled: !!examId && enabled,
    refetchInterval: enabled ? false : 5000,
  });

/* ----------------------- Exam Questions -------------------------- */
export const useExamQuestions = (examId?: string) =>
  useQuery({
    queryKey: ["exam-questions", examId],
    queryFn: () => examQuestionsApi.list(examId!),
    enabled: !!examId,
  });

export const useAttachQuestion = (examId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AttachQuestionInput) => examQuestionsApi.attach(examId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exam-questions", examId] });
      toast.success("Question added to exam");
    },
    onError: (e) => toast.error("Attach failed", errMsg(e)),
  });
};

export const useDetachQuestion = (examId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) => examQuestionsApi.detach(examId, questionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exam-questions", examId] });
      toast.success("Question removed");
    },
    onError: (e) => toast.error("Detach failed", errMsg(e)),
  });
};
