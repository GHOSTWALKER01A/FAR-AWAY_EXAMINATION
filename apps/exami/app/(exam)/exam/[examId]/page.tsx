"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { sessionsApi } from "@/lib/api/sessions";
import { AdaptiveRunner } from "@/components/exam/adaptive-runner";
import { PaperRunner } from "@/components/exam/paper-runner";
import { Spinner } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { getDeviceToken } from "@/lib/utils";
import type { ExamPaper, SessionStart } from "@/lib/types";
import { CheckCircle2 } from "lucide-react";

interface Boot {
  sessionId: string;
  remainingSeconds: number;
  answeredCount: number;
  paper: ExamPaper;
}

type PageState = "loading" | "ready" | "completed" | "error";

export default function ExamRunner() {
  const { examId } = useParams<{ examId: string }>();
  const router = useRouter();
  const [boot, setBoot] = useState<Boot | null>(null);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stashed = sessionStorage.getItem(`exami.start.${examId}`);
        let sessionId: string;
        let answeredCount = 0;
        if (stashed) {
          const start = JSON.parse(stashed) as SessionStart;
          sessionStorage.removeItem(`exami.start.${examId}`);
          sessionId = start.sessionId;
        } else {
          const resume = await sessionsApi.resume(examId, getDeviceToken());
          sessionId = resume.sessionId;
          answeredCount = resume.answeredCount;
        }

        const paper = await sessionsApi.paper(sessionId);
        if (cancelled) return;
        setBoot({ sessionId, remainingSeconds: paper.remainingSeconds, answeredCount, paper });
        setPageState("ready");
      } catch (e: any) {
        if (cancelled) return;
        const msg: string = e?.message ?? "";
        // Terminal session states — show a completion screen, not an error
        if (
          msg.includes("already completed") ||
          msg.includes("Session has ended") ||
          msg.includes("SUBMITTED") ||
          msg.includes("EXPIRED") ||
          msg.includes("ABANDONED")
        ) {
          setPageState("completed");
        } else {
          setErrorMsg(msg || "Could not start exam");
          setPageState("error");
        }
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  if (pageState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted">
          <Spinner className="h-7 w-7" />
          <p className="text-sm">Preparing your exam…</p>
        </div>
      </div>
    );
  }

  if (pageState === "completed") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <CheckCircle2 className="h-16 w-16 text-success" />
          <h2 className="text-xl font-bold">Exam Submitted</h2>
          <p className="text-sm text-muted max-w-xs">
            You have already submitted this exam. Your responses are being graded.
          </p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" onClick={() => router.replace(`/board/${examId}`)}>
              View scoreboard
            </Button>
            <Button onClick={() => router.replace("/exams")}>Back to exams</Button>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <p className="font-semibold text-danger">Could not start exam</p>
          <p className="text-sm text-muted">{errorMsg}</p>
          <Button onClick={() => router.replace("/exams")}>Back to exams</Button>
        </div>
      </div>
    );
  }

  if (!boot) return null;

  if (boot.paper.adaptive) {
    return (
      <AdaptiveRunner
        sessionId={boot.sessionId}
        initialRemaining={boot.remainingSeconds}
        initialAnswered={boot.answeredCount}
      />
    );
  }

  return (
    <PaperRunner
      sessionId={boot.sessionId}
      initialRemaining={boot.remainingSeconds}
      paper={boot.paper}
    />
  );
}
