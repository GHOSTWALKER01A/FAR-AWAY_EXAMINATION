"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { enrolmentApi } from "@/lib/api/enrolment";
import { useExam } from "@/lib/hooks/queries";
import { useAuth } from "@/lib/store/auth";
import { StudentTopbar } from "@/components/shared/student-topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingBlock } from "@/components/ui/misc";
import { CheckCircle2, Clock } from "lucide-react";
import type { ApiError } from "@/lib/api/client";

export default function RegisterExam() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const claims = useAuth((s) => s.claims);
  const { data: exam, isLoading } = useExam(id);
  const [name, setName] = useState(claims?.name ?? "");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");

  const register = useMutation({
    mutationFn: () =>
      enrolmentApi.selfRegister(id, {
        name,
        email: claims?.email ?? "",
        phone,
      }),
    onSuccess: (res) => setResult(res.status),
    onError: (e: ApiError) => setError(e.message),
  });

  if (isLoading || !exam) return <LoadingBlock />;

  const seatsLeft =
    exam.seatCap && exam.enrolledCount != null
      ? exam.seatCap - exam.enrolledCount
      : undefined;

  return (
    <div>
      <StudentTopbar />
      <div className="mx-auto max-w-md px-6 py-10">
        {result ? (
          <Card>
            <CardContent className="flex flex-col items-center py-10 text-center">
              {result === "ENROLLED" ? (
                <>
                  <CheckCircle2 className="mb-3 h-12 w-12 text-[var(--color-success)]" />
                  <p className="text-lg font-semibold">You&apos;re registered!</p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {exam.title}. You&apos;ll be able to enter when it goes live.
                  </p>
                </>
              ) : (
                <>
                  <Clock className="mb-3 h-12 w-12 text-[var(--color-warning)]" />
                  <p className="text-lg font-semibold">You&apos;re on the waitlist</p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    Seats are full. We&apos;ll email you if one opens up.
                  </p>
                </>
              )}
              <Button className="mt-5" onClick={() => router.push("/exams")}>
                Back to my exams
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{exam.title}</CardTitle>
              <CardDescription>
                {seatsLeft != null
                  ? `${seatsLeft} of ${exam.seatCap} seats remaining`
                  : "Register to take this exam"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setError("");
                  register.mutate();
                }}
              >
                <Field label="Full name">
                  <Input value={name} onChange={(e) => setName(e.target.value)} required />
                </Field>
                <Field label="Email">
                  <Input value={claims?.email ?? ""} readOnly />
                </Field>
                <Field label="Phone" error={error}>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Optional"
                  />
                </Field>
                <Button type="submit" className="w-full" loading={register.isPending}>
                  Register
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
