"use client";

import { useState, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { resultsApi } from "@/lib/api/results";
import { StudentTopbar } from "@/components/shared/student-topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/store/toast";
import { CheckCircle2 } from "lucide-react";
import type { ApiError } from "@/lib/api/client";

export default function RaiseDisputePage() {
  return (
    <Suspense>
      <RaiseDispute />
    </Suspense>
  );
}

function RaiseDispute() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const questionId = search.get("questionId") ?? "";
  const [reason, setReason] = useState("");
  const [done, setDone] = useState(false);

  const raise = useMutation({
    // sessionId doubles as the result identifier for the candidate's own result.
    mutationFn: () => resultsApi.raiseGrievance(sessionId, { questionId, reason }),
    onSuccess: () => setDone(true),
    onError: (e: ApiError) => toast.error("Could not submit", e.message),
  });

  return (
    <div>
      <StudentTopbar />
      <div className="mx-auto max-w-md px-6 py-10">
        {done ? (
          <Card>
            <CardContent className="flex flex-col items-center py-10 text-center">
              <CheckCircle2 className="mb-3 h-12 w-12 text-[var(--color-success)]" />
              <p className="text-lg font-semibold">Dispute submitted</p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                An examiner will review it. You&apos;ll see the outcome on your
                result.
              </p>
              <Button className="mt-5" onClick={() => router.push(`/results/${sessionId}`)}>
                Back to result
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Raise a dispute</CardTitle>
              <CardDescription>
                Explain why you think this question should be reviewed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Field label="Reason">
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Option B is also correct because…"
                  className="min-h-32"
                />
              </Field>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button
                  onClick={() => raise.mutate()}
                  disabled={reason.trim().length < 10}
                  loading={raise.isPending}
                >
                  Submit dispute
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
