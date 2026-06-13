"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function Submitted() {
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <CheckCircle2 className="mb-4 h-16 w-16 text-[var(--color-success)]" />
          <p className="text-xl font-semibold">Exam submitted</p>
          <p className="mt-2 max-w-xs text-sm text-[var(--color-muted)]">
            Thank you! Your answers are recorded. Results will be available once
            grading is complete.
          </p>
          <Button className="mt-6" onClick={() => router.push("/exams")}>
            Back to my exams
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
