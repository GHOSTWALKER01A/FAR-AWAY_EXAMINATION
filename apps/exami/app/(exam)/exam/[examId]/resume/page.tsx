"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { sessionsApi } from "@/lib/api/sessions";
import { getDeviceToken, fmtClock } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/misc";
import { RotateCw } from "lucide-react";
import type { ResumeInfo } from "@/lib/types";

export default function ResumeExam() {
  const { examId } = useParams<{ examId: string }>();
  const router = useRouter();
  const [info, setInfo] = useState<ResumeInfo | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    sessionsApi
      .resume(examId, getDeviceToken())
      .then(setInfo)
      .catch((e: Error) => setError(e.message));
  }, [examId]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center py-10 text-center">
          {error ? (
            <>
              <p className="font-semibold">No active session</p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{error}</p>
              <Button className="mt-5" onClick={() => router.push("/exams")}>
                Back to my exams
              </Button>
            </>
          ) : !info ? (
            <Spinner className="h-7 w-7" />
          ) : (
            <>
              <RotateCw className="mb-3 h-12 w-12 text-[var(--color-brand)]" />
              <p className="text-lg font-semibold">Resume your exam</p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {fmtClock(info.remainingSeconds)} remaining ·{" "}
                {info.answeredCount} answered
              </p>
              <Button
                className="mt-5 w-full"
                size="lg"
                onClick={() => router.push(`/exam/${examId}`)}
              >
                Resume now
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
