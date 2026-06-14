"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { sessionsApi } from "@/lib/api/sessions";
import { useExamLifecycle } from "@/lib/hooks/use-exam-lifecycle";
import { ExamTimer } from "@/components/exam/exam-timer";
import { QuestionRenderer, type AnswerValue } from "@/components/exam/question-renderer";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { makeNonce } from "@/lib/utils";
import { toast } from "@/lib/store/toast";
import type { NextItem } from "@/lib/types";
import { AlertTriangle, Send, Wifi, WifiOff } from "lucide-react";

type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * Adaptive (CAT) runner — strictly forward-only. The next item depends on the
 * candidate's running ability estimate, so previous answers cannot be revisited.
 */
export function AdaptiveRunner({
  sessionId,
  initialRemaining,
  initialAnswered,
}: {
  sessionId: string;
  initialRemaining: number;
  initialAnswered: number;
}) {
  const router = useRouter();
  const { remaining, online, warn } = useExamLifecycle(sessionId, initialRemaining);

  const [item, setItem] = useState<NextItem | null>(null);
  const [answer, setAnswer] = useState<AnswerValue | null>(null);
  const [answered, setAnswered] = useState(initialAnswered);
  const [save, setSave] = useState<SaveState>("idle");
  const [done, setDone] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const nonceRef = useRef<string>("");
  const questionStart = useRef<number>(0);

  const loadNext = useCallback(async (sid: string) => {
    const next = await sessionsApi.nextItem(sid);
    if (next.done || !next.id) {
      setDone(true);
      setConfirmSubmit(true);
      return;
    }
    setItem(next);
    setAnswer(null);
    setSave("idle");
    nonceRef.current = makeNonce("ans");
    questionStart.current = Date.now();
  }, []);

  useEffect(() => {
    void loadNext(sessionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const submitAnswer = async () => {
    if (!item || !answer) return;
    setSave("saving");
    localStorage.setItem(`exami.ans.${sessionId}.${item.id}`, JSON.stringify(answer));
    try {
      await sessionsApi.answer(sessionId, {
        questionId: item.id!,
        answer,
        timeSpentMs: Date.now() - questionStart.current,
        clientNonce: nonceRef.current,
      });
      setSave("saved");
      setAnswered((n) => n + 1);
      await loadNext(sessionId);
    } catch {
      setSave("error");
      toast.error("Save failed", "We'll keep your answer and retry.");
    }
  };

  const doSubmit = async () => {
    try {
      await sessionsApi.submit(sessionId);
      router.replace("/exam/submitted");
    } catch (e) {
      toast.error("Submit failed", (e as Error).message);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)]">
      <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-muted)]">
            {online ? (
              <Wifi className="h-4 w-4 text-[var(--color-success)]" />
            ) : (
              <WifiOff className="h-4 w-4 text-[var(--color-danger)]" />
            )}
            <span>Answered {answered}</span>
          </div>
          <ExamTimer remaining={remaining} />
          <Button variant="danger" size="sm" onClick={() => setConfirmSubmit(true)}>
            <Send className="h-4 w-4" /> Submit
          </Button>
        </div>
        {warn && (
          <div className="flex items-center justify-center gap-2 bg-[var(--color-warning-soft)] px-4 py-1.5 text-sm text-[var(--color-warning)]">
            <AlertTriangle className="h-4 w-4" /> {warn}
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        {item && (
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <QuestionRenderer item={item} value={answer} onChange={setAnswer} />
          </div>
        )}

        <div className="mt-5 flex items-center justify-between">
          <span className="text-sm text-[var(--color-muted)]">
            {save === "saving" && "Saving…"}
            {save === "saved" && "Saved ✓"}
            {save === "error" && "Save failed — retrying"}
          </span>
          <Button
            size="lg"
            disabled={!answer || save === "saving"}
            loading={save === "saving"}
            onClick={submitAnswer}
          >
            Save & next
          </Button>
        </div>

        <p className="mt-4 text-center text-xs text-[var(--color-muted-2)]">
          This is an adaptive test — you cannot return to previous questions. Your
          time is tracked on the server.
        </p>
      </main>

      <Modal
        open={confirmSubmit}
        onClose={() => !done && setConfirmSubmit(false)}
        title="Submit your exam?"
        description={
          done
            ? "You've reached the end. Submit to finish."
            : `You've answered ${answered} questions. You cannot resume after submitting.`
        }
        footer={
          <>
            {!done && (
              <Button variant="ghost" onClick={() => setConfirmSubmit(false)}>
                Keep going
              </Button>
            )}
            <Button onClick={doSubmit}>Submit exam</Button>
          </>
        }
      />
    </div>
  );
}
