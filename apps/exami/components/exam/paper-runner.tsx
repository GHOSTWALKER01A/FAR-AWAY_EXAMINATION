"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { sessionsApi } from "@/lib/api/sessions";
import { useExamLifecycle } from "@/lib/hooks/use-exam-lifecycle";
import { ExamTimer } from "@/components/exam/exam-timer";
import { QuestionRenderer, type AnswerValue } from "@/components/exam/question-renderer";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn, makeNonce } from "@/lib/utils";
import { toast } from "@/lib/store/toast";
import type { ExamPaper, NextItem } from "@/lib/types";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eraser,
  Flag,
  LayoutGrid,
  Send,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";

type SaveState = "idle" | "saving" | "saved" | "error";

type Status =
  | "answered"
  | "notAnswered"
  | "notVisited"
  | "marked"
  | "markedAnswered";

function isEmpty(v: AnswerValue | null | undefined): boolean {
  if (v == null) return true;
  if ("optionIds" in v) return v.optionIds.length === 0;
  if ("text" in v) return v.text.trim() === "";
  if ("value" in v) return v.value == null || Number.isNaN(Number(v.value));
  return false;
}

const STATUS_STYLE: Record<Status, string> = {
  answered: "bg-[var(--color-success)] text-white border-transparent",
  notAnswered: "bg-[var(--color-danger)] text-white border-transparent",
  notVisited: "bg-[var(--color-surface-2)] text-[var(--color-muted)] border-border",
  marked: "bg-[#8b5cf6] text-white border-transparent",
  markedAnswered: "bg-[#8b5cf6] text-white border-transparent ring-2 ring-[var(--color-success)]",
};

/**
 * Full-paper runner for FIXED / RANDOMISED exams: free navigation across all
 * questions with a status palette, mark-for-review, clear-response, edit, and a
 * pre-submit summary. Answers are persisted on every move (append-only on the
 * server — latest write wins) so back-navigation and reloads are lossless.
 */
export function PaperRunner({
  sessionId,
  initialRemaining,
  paper,
}: {
  sessionId: string;
  initialRemaining: number;
  paper: ExamPaper;
}) {
  const router = useRouter();
  const { remaining, online, warn } = useExamLifecycle(sessionId, initialRemaining);

  const questions = paper.questions as NextItem[];
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue | null>>(
    () => ({ ...(paper.answers as Record<string, AnswerValue | null>) }),
  );
  const [review, setReview] = useState<Set<string>>(
    () => new Set(paper.reviewMarks),
  );
  const [visited, setVisited] = useState<Set<string>>(
    () => new Set(questions[0]?.id ? [questions[0].id] : []),
  );
  const [save, setSave] = useState<SaveState>("idle");
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // JSON of the last value persisted to the server, per question id — dirty check.
  const savedRef = useRef<Record<string, string>>(
    Object.fromEntries(
      Object.entries(paper.answers).map(([k, v]) => [k, JSON.stringify(v)]),
    ),
  );
  const questionStart = useRef<number>(Date.now());

  const q = questions[current];
  const currentAnswer = q?.id ? answers[q.id] ?? null : null;

  const setCurrentAnswer = (v: AnswerValue) => {
    if (!q) return;
    setAnswers((a) => ({ ...a, [q.id!]: v }));
  };

  // Persist a single question's answer if it changed since the last save.
  const persist = useCallback(
    async (qid: string, value: AnswerValue | null): Promise<boolean> => {
      const json = JSON.stringify(value);
      if (savedRef.current[qid] === json) return true; // not dirty
      setSave("saving");
      try {
        await sessionsApi.answer(sessionId, {
          questionId: qid,
          answer: value,
          timeSpentMs: Date.now() - questionStart.current,
          clientNonce: makeNonce("ans"),
        });
        savedRef.current[qid] = json;
        if (value == null) localStorage.removeItem(`exami.ans.${sessionId}.${qid}`);
        else localStorage.setItem(`exami.ans.${sessionId}.${qid}`, json);
        setSave("saved");
        return true;
      } catch {
        setSave("error");
        toast.error("Save failed", "Check your connection — we'll retry on the next move.");
        return false;
      }
    },
    [sessionId],
  );

  const saveCurrent = useCallback(async () => {
    if (!q) return true;
    return persist(q.id!, answers[q.id!] ?? null);
  }, [q, answers, persist]);

  // Debounced autosave while editing the current question.
  useEffect(() => {
    if (!q) return;
    const id = setTimeout(() => {
      void persist(q.id!, answers[q.id!] ?? null);
    }, 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q?.id, currentAnswer]);

  const goTo = useCallback(
    async (idx: number) => {
      if (idx < 0 || idx >= questions.length || idx === current) {
        setPaletteOpen(false);
        return;
      }
      await saveCurrent();
      const target = questions[idx];
      if (target?.id) setVisited((s) => new Set(s).add(target.id!));
      setCurrent(idx);
      questionStart.current = Date.now();
      setSave("idle");
      setPaletteOpen(false);
    },
    [questions, current, saveCurrent],
  );

  const toggleReview = useCallback(async () => {
    if (!q) return;
    const marked = !review.has(q.id!);
    setReview((s) => {
      const n = new Set(s);
      if (marked) n.add(q.id!);
      else n.delete(q.id!);
      return n;
    });
    try {
      await sessionsApi.review(sessionId, q.id!, marked);
    } catch {
      // Revert on failure
      setReview((s) => {
        const n = new Set(s);
        if (marked) n.delete(q.id!);
        else n.add(q.id!);
        return n;
      });
      toast.error("Could not update review flag");
    }
  }, [q, review, sessionId]);

  const clearCurrent = useCallback(async () => {
    if (!q) return;
    setAnswers((a) => ({ ...a, [q.id!]: null }));
    await persist(q.id!, null);
  }, [q, persist]);

  const markReviewAndNext = useCallback(async () => {
    if (!q) return;
    if (!review.has(q.id!)) await toggleReview();
    if (current < questions.length - 1) await goTo(current + 1);
  }, [q, review, current, questions.length, toggleReview, goTo]);

  const statusOf = useCallback(
    (idx: number): Status => {
      const qq = questions[idx];
      if (!qq?.id) return "notVisited";
      const hasAns = !isEmpty(answers[qq.id]);
      const marked = review.has(qq.id);
      const seen = visited.has(qq.id);
      if (marked && hasAns) return "markedAnswered";
      if (marked) return "marked";
      if (hasAns) return "answered";
      if (seen) return "notAnswered";
      return "notVisited";
    },
    [questions, answers, review, visited],
  );

  const counts = useMemo(() => {
    let answered = 0,
      marked = 0,
      notAnswered = 0,
      notVisited = 0;
    questions.forEach((qq, i) => {
      const s = statusOf(i);
      if (s === "answered" || s === "markedAnswered") answered++;
      if (s === "marked" || s === "markedAnswered") marked++;
      if (s === "notAnswered") notAnswered++;
      if (s === "notVisited") notVisited++;
    });
    return { answered, marked, notAnswered, notVisited, total: questions.length };
  }, [questions, statusOf]);

  const doSubmit = async () => {
    await saveCurrent();
    try {
      await sessionsApi.submit(sessionId);
      router.replace("/exam/submitted");
    } catch (e) {
      toast.error("Submit failed", (e as Error).message);
    }
  };

  if (!questions.length) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--color-bg)] p-6 text-center">
        <AlertTriangle className="h-9 w-9 text-[var(--color-warning)]" />
        <div>
          <p className="font-semibold">No questions are available</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            This exam has no questions attached. Please contact your invigilator.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.replace("/exams")}>
          Back to my exams
        </Button>
      </div>
    );
  }

  const Palette = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 text-xs text-[var(--color-muted)]">
        <Legend className="bg-[var(--color-success)]" label={`Answered (${counts.answered})`} />
        <Legend className="bg-[var(--color-danger)]" label={`Not answered (${counts.notAnswered})`} />
        <Legend className="bg-[#8b5cf6]" label={`Marked (${counts.marked})`} />
        <Legend className="bg-[var(--color-surface-2)] border border-border" label={`Not visited (${counts.notVisited})`} />
      </div>
      <div className="grid grid-cols-5 gap-2">
        {questions.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => void goTo(i)}
            className={cn(
              "flex h-9 w-full items-center justify-center rounded-md border text-sm font-semibold transition",
              STATUS_STYLE[statusOf(i)],
              i === current && "outline outline-2 outline-offset-1 outline-[var(--color-brand)]",
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)]">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-muted)]">
            {online ? (
              <Wifi className="h-4 w-4 text-[var(--color-success)]" />
            ) : (
              <WifiOff className="h-4 w-4 text-[var(--color-danger)]" />
            )}
            <span className="hidden sm:inline">
              {counts.answered}/{counts.total} answered
            </span>
          </div>
          <ExamTimer remaining={remaining} />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setPaletteOpen(true)}
            >
              <LayoutGrid className="h-4 w-4" /> Palette
            </Button>
            <Button variant="danger" size="sm" onClick={() => setConfirmSubmit(true)}>
              <Send className="h-4 w-4" /> Submit
            </Button>
          </div>
        </div>
        {warn && (
          <div className="flex items-center justify-center gap-2 bg-[var(--color-warning-soft)] px-4 py-1.5 text-sm text-[var(--color-warning)]">
            <AlertTriangle className="h-4 w-4" /> {warn}
          </div>
        )}
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-4 py-6">
        {/* Question column */}
        <main className="min-w-0 flex-1">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-[var(--color-muted)]">
              Question {current + 1} of {questions.length}
            </p>
            <button
              type="button"
              onClick={() => void toggleReview()}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition",
                q && review.has(q.id!)
                  ? "border-transparent bg-[#8b5cf6] text-white"
                  : "border-border text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]",
              )}
            >
              <Flag className="h-3.5 w-3.5" />
              {q && review.has(q.id!) ? "Marked for review" : "Mark for review"}
            </button>
          </div>

          {q && (
            <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <QuestionRenderer item={q} value={currentAnswer} onChange={setCurrentAnswer} />
            </div>
          )}

          <div className="mt-3 flex h-5 items-center text-xs text-[var(--color-muted)]">
            {save === "saving" && "Saving…"}
            {save === "saved" && "Saved ✓"}
            {save === "error" && "Save failed — will retry on next action"}
          </div>

          {/* Controls */}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => void goTo(current - 1)}
              disabled={current === 0}
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => void clearCurrent()}
                disabled={isEmpty(currentAnswer)}
              >
                <Eraser className="h-4 w-4" /> Clear
              </Button>
              <Button variant="outline" onClick={() => void markReviewAndNext()}>
                <Flag className="h-4 w-4" /> Review &amp; next
              </Button>
              {current < questions.length - 1 ? (
                <Button onClick={() => void goTo(current + 1)}>
                  Save &amp; next <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={() => setConfirmSubmit(true)}>
                  <Send className="h-4 w-4" /> Review &amp; submit
                </Button>
              )}
            </div>
          </div>
        </main>

        {/* Palette (desktop) */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-20 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="mb-3 text-sm font-semibold">Question palette</p>
            {Palette}
          </div>
        </aside>
      </div>

      {/* Palette (mobile drawer) */}
      {paletteOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setPaletteOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-[var(--color-surface)] p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold">Question palette</p>
              <button onClick={() => setPaletteOpen(false)} aria-label="Close">
                <X className="h-5 w-5 text-[var(--color-muted)]" />
              </button>
            </div>
            {Palette}
          </div>
        </div>
      )}

      {/* Submit confirmation */}
      <Modal
        open={confirmSubmit}
        onClose={() => setConfirmSubmit(false)}
        title="Submit your exam?"
        description="Review your progress below. You cannot resume after submitting."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmSubmit(false)}>
              Keep going
            </Button>
            <Button onClick={doSubmit}>Submit exam</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Stat label="Answered" value={counts.answered} tone="text-[var(--color-success)]" />
          <Stat label="Not answered" value={counts.notAnswered} tone="text-[var(--color-danger)]" />
          <Stat label="Marked for review" value={counts.marked} tone="text-[#8b5cf6]" />
          <Stat label="Not visited" value={counts.notVisited} tone="text-[var(--color-muted)]" />
        </div>
        {counts.marked > 0 && (
          <p className="mt-3 text-xs text-[var(--color-warning)]">
            You still have {counts.marked} question{counts.marked !== 1 ? "s" : ""} marked for review.
          </p>
        )}
      </Modal>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("h-3 w-3 rounded-sm", className)} />
      {label}
    </span>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-lg border border-border bg-[var(--color-surface-2)] p-3">
      <p className={cn("text-2xl font-bold tabular-nums", tone)}>{value}</p>
      <p className="text-xs text-[var(--color-muted)]">{label}</p>
    </div>
  );
}
