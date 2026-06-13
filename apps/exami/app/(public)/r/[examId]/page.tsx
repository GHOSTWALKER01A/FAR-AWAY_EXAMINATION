"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/api/auth";
import { enrolmentApi } from "@/lib/api/enrolment";
import { useExam } from "@/lib/hooks/queries";
import { useAuth } from "@/lib/store/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingBlock } from "@/components/ui/misc";
import { toast } from "@/lib/store/toast";
import { CheckCircle2, Clock } from "lucide-react";
import type { ApiError } from "@/lib/api/client";

type Step = "details" | "otp" | "done";

export default function PublicRegister() {
  const { examId } = useParams<{ examId: string }>();
  const { data: exam, isLoading } = useExam(examId);
  const signIn = useAuth((s) => s.signIn);

  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState("");

  const requestOtp = useMutation({
    mutationFn: () => authApi.requestOtp(email),
    onSuccess: () => {
      setStep("otp");
      toast.success("OTP sent", `Check ${email}.`);
    },
    onError: (e: ApiError) => setError(e.message),
  });

  const verifyAndRegister = useMutation({
    mutationFn: async () => {
      const tokens = await authApi.verifyOtp(email, otp);
      signIn(tokens.accessToken, tokens.refreshToken);
      return enrolmentApi.selfRegister(examId, { name, email, phone });
    },
    onSuccess: (res) => {
      setResult(res.status);
      setStep("done");
    },
    onError: (e: ApiError) => setError(e.message),
  });

  if (isLoading || !exam) return <LoadingBlock />;

  const seatsLeft =
    exam.seatCap && exam.enrolledCount != null
      ? exam.seatCap - exam.enrolledCount
      : undefined;

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>{exam.title}</CardTitle>
          <CardDescription>
            {seatsLeft != null
              ? `${seatsLeft} of ${exam.seatCap} seats remaining`
              : exam.description ?? "Register for this exam"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "details" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setError("");
                requestOtp.mutate();
              }}
            >
              <Field label="Full name">
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <Field label="Phone" error={error}>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </Field>
              <Button type="submit" className="w-full" loading={requestOtp.isPending}>
                Continue
              </Button>
            </form>
          )}

          {step === "otp" && (
            <div>
              <Field label="Enter the 6-digit OTP" error={error}>
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••••"
                  className="text-center text-lg tracking-widest"
                />
              </Field>
              <Button
                className="w-full"
                disabled={otp.length !== 6}
                loading={verifyAndRegister.isPending}
                onClick={() => {
                  setError("");
                  verifyAndRegister.mutate();
                }}
              >
                Verify & register
              </Button>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center py-6 text-center">
              {result === "ENROLLED" ? (
                <>
                  <CheckCircle2 className="mb-3 h-12 w-12 text-[var(--color-success)]" />
                  <p className="font-semibold">You&apos;re registered!</p>
                </>
              ) : (
                <>
                  <Clock className="mb-3 h-12 w-12 text-[var(--color-warning)]" />
                  <p className="font-semibold">Added to the waitlist</p>
                </>
              )}
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                We&apos;ll email you joining instructions for {exam.title}.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
