"use client";

import { useState } from "react";
import {
  useExamQuestions,
  useAttachQuestion,
  useDetachQuestion,
  useQuestions,
} from "@/lib/hooks/queries";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingBlock } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";
import { BookOpen, Plus, Trash2, GripVertical } from "lucide-react";
import type { ExamMode, ExamStatus, Question } from "@/lib/types";

const DIFF_TONE = {
  EASY: "success",
  MEDIUM: "warning",
  HARD: "danger",
} as const;

const TYPE_LABEL: Record<string, string> = {
  MCQ: "MCQ",
  MULTI_SELECT: "Multi",
  SHORT: "Short",
  LONG: "Long",
  NUMERIC: "Numeric",
  CODE: "Code",
};

interface Props {
  examId: string;
  mode: ExamMode;
  status: ExamStatus;
}

export function ExamQuestionsPanel({ examId, mode, status }: Props) {
  const isDraft = status === "DRAFT";
  const { data: attached, isLoading } = useExamQuestions(examId);
  const detach = useDetachQuestion(examId);
  const attach = useAttachQuestion(examId);
  const [bankOpen, setBankOpen] = useState(false);

  const totalMarks = (attached ?? []).reduce(
    (sum, eq) => sum + (eq.question?.marks ?? 0) * (eq.weight ?? 1),
    0,
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-muted">
          {(attached ?? []).length} question{attached?.length !== 1 ? "s" : ""}
          {totalMarks > 0 && ` · ${totalMarks} total marks`}
          {mode === "ADAPTIVE" && " · Adaptive — drawn from bank at runtime"}
          {mode === "RANDOMISED" && " · Randomised — drawn from blueprint"}
        </div>
        {isDraft && mode === "FIXED" && (
          <Button variant="outline" onClick={() => setBankOpen(true)}>
            <Plus className="h-4 w-4" /> Add from bank
          </Button>
        )}
        {!isDraft && (
          <Badge tone="neutral">Published — read only</Badge>
        )}
      </div>

      {isLoading ? (
        <LoadingBlock />
      ) : !attached || attached.length === 0 ? (
        <EmptyState
          title="No questions attached"
          message={
            mode === "FIXED"
              ? isDraft
                ? "Click 'Add from bank' to attach questions to this exam."
                : "No questions were attached before publishing."
              : mode === "ADAPTIVE"
                ? "Adaptive exams draw from the calibrated question bank automatically. Ensure you have enough CALIBRATED items."
                : "Configure a blueprint and attach randomised question pools in the exam settings."
          }
        />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH className="w-8">#</TH>
              <TH>Stem</TH>
              <TH>Type</TH>
              <TH>Difficulty</TH>
              <TH>Marks</TH>
              <TH>Weight</TH>
              {isDraft && <TH className="w-10" />}
            </tr>
          </THead>
          <tbody>
            {attached
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((eq, i) => (
                <TR key={eq.questionId}>
                  <TD className="text-muted">
                    {isDraft ? (
                      <GripVertical className="h-4 w-4 cursor-grab text-muted" />
                    ) : (
                      i + 1
                    )}
                  </TD>
                  <TD className="max-w-xs">
                    <p className="line-clamp-2 text-sm font-medium">
                      {eq.question?.stem ?? "—"}
                    </p>
                    {eq.question?.topicTags && eq.question.topicTags.length > 0 && (
                      <p className="mt-0.5 text-xs text-muted">
                        {eq.question.topicTags.join(", ")}
                      </p>
                    )}
                  </TD>
                  <TD>
                    <Badge tone="neutral">
                      {TYPE_LABEL[eq.question?.type ?? ""] ?? eq.question?.type}
                    </Badge>
                  </TD>
                  <TD>
                    {eq.question?.difficulty && (
                      <Badge tone={DIFF_TONE[eq.question.difficulty]}>
                        {eq.question.difficulty}
                      </Badge>
                    )}
                  </TD>
                  <TD className="tabular-nums">{eq.question?.marks ?? "—"}</TD>
                  <TD className="tabular-nums text-muted">
                    {eq.weight ?? 1}×
                  </TD>
                  {isDraft && (
                    <TD>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => detach.mutate(eq.questionId)}
                        loading={detach.isPending}
                        aria-label="Remove question"
                      >
                        <Trash2 className="h-4 w-4 text-danger" />
                      </Button>
                    </TD>
                  )}
                </TR>
              ))}
          </tbody>
        </Table>
      )}

      <QuestionBankModal
        open={bankOpen}
        onClose={() => setBankOpen(false)}
        examId={examId}
        alreadyAttached={(attached ?? []).map((eq) => eq.questionId)}
        onAttach={(q) => {
          const nextOrder = (attached?.length ?? 0) + 1;
          attach.mutate({ questionId: q.id, order: nextOrder });
        }}
        isPending={attach.isPending}
      />
    </div>
  );
}

function QuestionBankModal({
  open,
  onClose,
  examId: _examId,
  alreadyAttached,
  onAttach,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  examId: string;
  alreadyAttached: string[];
  onAttach: (q: Question) => void;
  isPending: boolean;
}) {
  const [search, setSearch] = useState("");
  const { data: questions, isLoading } = useQuestions(
    open ? { search: search || undefined, limit: 50 } : undefined,
  );
  if (!open) return null;

  const available = (questions ?? []).filter(
    (q) => !alreadyAttached.includes(q.id),
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add questions from bank"
      description="Select questions to attach to this exam. Already-attached questions are hidden."
    >
      <div className="mb-3">
        <input
          type="text"
          placeholder="Search by stem or topic…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-(--color-surface) px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/50"
        />
      </div>

      {isLoading ? (
        <LoadingBlock />
      ) : !available.length ? (
        <p className="py-6 text-center text-sm text-muted">
          {questions?.length === 0
            ? "No questions in bank yet. Create some in the Question Bank."
            : "All questions already attached."}
        </p>
      ) : (
        <div className="max-h-105 space-y-2 overflow-y-auto">
          {available.map((q) => (
            <div
              key={q.id}
              className="flex items-start gap-3 rounded-lg border border-border p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium">{q.stem}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Badge tone="neutral">{TYPE_LABEL[q.type] ?? q.type}</Badge>
                  <Badge tone={DIFF_TONE[q.difficulty]}>{q.difficulty}</Badge>
                  <span className="text-xs text-muted">
                    {q.marks} mark{q.marks !== 1 ? "s" : ""}
                  </span>
                  {q.topicTags?.map((t) => (
                    <span key={t} className="text-xs text-muted">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAttach(q)}
                loading={isPending}
              >
                <BookOpen className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
