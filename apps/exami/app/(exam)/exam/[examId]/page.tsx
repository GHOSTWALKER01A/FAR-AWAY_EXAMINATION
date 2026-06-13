"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { sessionsApi } from "@/lib/api/sessions";
import { useCountdown } from "@/lib/hooks/use-countdown";
import { useProctorEmitter } from "@/lib/hooks/use-proctor-emitter";
import { ExamTimer } from "@/components/exam/exam-timer";
import { QuestionRenderer, type AnswerValue } from "@/components/exam/question-renderer";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/misc";
import { getDeviceToken, makeNonce } from "@/lib/utils";
import { toast } from "@/lib/store/toast";
import type { NextItem, SessionStart } from "@/lib/types";
import { AlertTriangle, Send, Wifi, WifiOff } from "lucide-react";

type Phase = "booting" | "active" | "done";
type SaveState = "idle" | "saving" | "saved" | "error";

export default function ExamRunner() {
  const { examId } = useParams<{ examId: string }>();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("booting");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [item, setItem] = useState<NextItem | null>(null);
  const [answer, setAnswer] = useState<AnswerValue | null>(null);
  const [answered, setAnswered] = useState(0);
  const [save, setSave] = useState<SaveState>("idle");
  const [online, setOnline] = useState(true);
  const [warn, setWarn] = useState<string | null>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [initialRemaining, setInitialRemaining] = useState(0);

  const nonceRef = useRef<string>("");
  const questionStart = useRef<number>(0);

  const { remaining, sync } = useCountdown(initialRemaining);
  useProctorEmitter(sessionId, (m) => setWarn(m));

  const loadNext = useCallback(
    async (sid: string) => {
      const next = await sessionsApi.nextItem(sid);
      if (next.done || !next.id) {
        setPhase("done");
        setConfirmSubmit(true);
        return;
      }
      setItem(next);
      setAnswer(null);
      setSave("idle");
      nonceRef.current = makeNonce("ans");
      questionStart.current = Date.now();
    },
    [],
  );

  // Boot: use the start payload from the check page, else resume.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stashed = sessionStorage.getItem(`examfar.start.${examId}`);
        let start: SessionStart;
        if (stashed) {
          start = JSON.parse(stashed) as SessionStart;
          sessionStorage.removeItem(`examfar.start.${examId}`);
        } else {
          const resume = await sessionsApi.resume(examId, getDeviceToken());
          start = {
            sessionId: resume.sessionId,
            deadlineAt: "",
            remainingSeconds: resume.remainingSeconds,
          };
          setAnswered(resume.answeredCount);
        }
        if (cancelled) return;
        setSessionId(start.sessionId);
        setInitialRemaining(start.remainingSeconds);
        sync(start.remainingSeconds);
        setPhase("active");
        await loadNext(start.sessionId);
      } catch (e) {
        toast.error("Could not start exam", (e as Error).message);
        router.replace("/exams");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  // Heartbeat — server-authoritative timer + device-takeover detection.
  useEffect(() => {
    if (!sessionId || phase !== "active") return;
    const id = setInterval(async () => {
      try {
        const hb = await sessionsApi.heartbeat(sessionId, getDeviceToken());
        sync(hb.remainingSeconds);
        setOnline(true);
        if (hb.remainingSeconds <= 0) {
          setPhase("done");
          toast.warning("Time is up", "Submitting your exam.");
          await sessionsApi.submit(sessionId);
          router.replace("/exam/submitted");
        }
      } catch (e) {
        const msg = (e as Error).message || "";
        if (msg.toLowerCase().includes("another") || msg.includes("409")) {
          toast.error("Session opened elsewhere", "This device was disconnected.");
          router.replace("/exams");
        } else {
          setOnline(false);
        }
      }
    }, 12000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, phase]);

  const submitAnswer = async () => {
    if (!sessionId || !item || !answer) return;
    setSave("saving");
    // Cache locally before the network call.
    localStorage.setItem(
      `examfar.ans.${sessionId}.${item.id}`,
      JSON.stringify(answer),
    );
    try {
      await sessionsApi.answer(sessionId, {
        questionId: item.id,
        answer,
        timeSpentMs: Date.now() - questionStart.current,
        clientNonce: nonceRef.current, // reused on retry → idempotent
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
    if (!sessionId) return;
    try {
      await sessionsApi.submit(sessionId);
      router.replace("/exam/submitted");
    } catch (e) {
      toast.error("Submit failed", (e as Error).message);
    }
  };

  if (phase === "booting") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-[var(--color-muted)]">
          <Spinner className="h-7 w-7" />
          <p className="text-sm">Preparing your exam…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)]">
      {/* Locked top bar */}
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
          <Button
            variant="danger"
            size="sm"
            onClick={() => setConfirmSubmit(true)}
          >
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
          You cannot return to previous questions. Your time is tracked on the
          server.
        </p>
      </main>

      <Modal
        open={confirmSubmit}
        onClose={() => phase !== "done" && setConfirmSubmit(false)}
        title="Submit your exam?"
        description={
          phase === "done"
            ? "You've reached the end. Submit to finish."
            : `You've answered ${answered} questions. You cannot resume after submitting.`
        }
        footer={
          <>
            {phase !== "done" && (
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
