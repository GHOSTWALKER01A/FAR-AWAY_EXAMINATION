"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/api/auth";
import { useAuth, HOME_BY_ROLE } from "@/lib/store/auth";
import { decodeJwt } from "@/lib/utils";
import type { JwtClaims } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/store/toast";
import type { ApiError } from "@/lib/api/client";

export default function OtpPage() {
  const router = useRouter();
  const signIn = useAuth((s) => s.signIn);
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const requestOtp = useMutation({
    mutationFn: () => authApi.requestOtp(email),
    onSuccess: () => {
      setStep("code");
      setCooldown(60);
      toast.success("OTP sent", `Check ${email} for the 6-digit code.`);
      setTimeout(() => inputs.current[0]?.focus(), 50);
    },
    onError: (e: ApiError) => setError(e.message),
  });

  const verifyOtp = useMutation({
    mutationFn: (code: string) => authApi.verifyOtp(email, code),
    onSuccess: (tokens) => {
      signIn(tokens.accessToken, tokens.refreshToken);
      const claims = decodeJwt<JwtClaims>(tokens.accessToken);
      router.replace(claims ? HOME_BY_ROLE[claims.role] : "/exams");
    },
    onError: (e: ApiError) => {
      setError(e.message || "Invalid OTP");
      setDigits(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    },
  });

  const onDigit = (i: number, val: string) => {
    const v = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    setError("");
    if (v && i < 5) inputs.current[i + 1]?.focus();
    if (next.every((d) => d) && next.join("").length === 6) {
      verifyOtp.mutate(next.join(""));
    }
  };

  const onKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0)
      inputs.current[i - 1]?.focus();
  };

  return (
    <Card className={error ? "animate-shake" : ""}>
      <CardHeader>
        <CardTitle className="text-xl">
          {step === "email" ? "Student sign in" : "Enter your code"}
        </CardTitle>
        <CardDescription>
          {step === "email"
            ? "We'll email you a one-time passcode."
            : `Sent to ${email}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "email" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setError("");
              requestOtp.mutate();
            }}
          >
            <Field label="Email" error={error}>
              <Input
                type="email"
                autoFocus
                required
                placeholder="you@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Button
              type="submit"
              className="w-full"
              loading={requestOtp.isPending}
            >
              Send OTP
            </Button>
          </form>
        ) : (
          <div>
            <div className="mb-4 flex justify-center gap-2">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputs.current[i] = el;
                  }}
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => onDigit(i, e.target.value)}
                  onKeyDown={(e) => onKey(i, e)}
                  className="h-14 w-12 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-center text-2xl font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]/40"
                />
              ))}
            </div>
            {error && (
              <p className="mb-3 text-center text-sm text-[var(--color-danger)]">
                {error}
              </p>
            )}
            {verifyOtp.isPending && (
              <p className="mb-3 text-center text-sm text-[var(--color-muted)]">
                Verifying…
              </p>
            )}
            <Button
              variant="ghost"
              className="w-full"
              disabled={cooldown > 0 || requestOtp.isPending}
              onClick={() => requestOtp.mutate()}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </Button>
          </div>
        )}

        <div className="mt-5 border-t border-[var(--color-border)] pt-4 text-center text-sm text-[var(--color-muted)]">
          Staff member?{" "}
          <Link href="/login" className="font-medium text-[var(--color-brand)]">
            Password sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
