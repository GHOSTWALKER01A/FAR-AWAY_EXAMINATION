"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/api/auth";
import { enrolmentApi } from "@/lib/api/enrolment";
import { useExam, useMyExamStatus } from "@/lib/hooks/queries";
import { useAuth } from "@/lib/store/auth";
import { Button } from "@/components/ui/button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Field, Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";
import { toast } from "@/lib/store/toast";
import { cn, fmtDate } from "@/lib/utils";
import type { ApiError } from "@/lib/api/client";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  Lock,
  Mail,
  Phone,
  RefreshCw,
  Timer,
  Trophy,
  User,
  Users,
  Zap,
} from "lucide-react";

type Step = "details" | "otp" | "done";

/* ── countdown ─────────────────────────────────────────────────────── */
function useCountdown(targetIso?: string | null) {
  const [secs, setSecs] = useState<number | null>(null);
  useEffect(() => {
    if (!targetIso) return;
    const t = new Date(targetIso).getTime();
    const tick = () => setSecs(Math.max(0, Math.floor((t - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);
  return secs;
}

function fmtCountdown(s: number) {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  return `${m}m ${sec}s`;
}

/* ── seat bar ──────────────────────────────────────────────────────── */
function SeatBar({ cap, enrolled }: { cap: number; enrolled: number }) {
  const pct = Math.min(100, Math.round((enrolled / cap) * 100));
  const color = pct >= 100 ? "var(--color-danger)" : pct >= 80 ? "var(--color-warning)" : "var(--color-success)";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted">{enrolled} enrolled</span>
        <span className="font-medium" style={{ color }}>
          {cap - enrolled <= 0 ? "Full" : `${cap - enrolled} seats left`}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

/* ── status screen ─────────────────────────────────────────────────── */
function StatusScreen({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-2">{icon}</div>
      <p className="text-xl font-bold">{title}</p>
      {subtitle && <p className="max-w-xs text-sm text-muted">{subtitle}</p>}
      {children}
    </div>
  );
}

/* ── info card ─────────────────────────────────────────────────────── */
function InfoCard({
  icon,
  label,
  value,
  valueTone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueTone?: "danger" | "warning" | "success";
}) {
  const toneClass = valueTone === "danger" ? "text-danger" : valueTone === "warning" ? "text-warning" : valueTone === "success" ? "text-success" : "";
  return (
    <div className="rounded-xl border border-border bg-surface-2 p-3">
      <div className="mb-1.5 flex items-center gap-1.5">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
      </div>
      <p className={cn("text-sm font-semibold", toneClass)}>{value}</p>
    </div>
  );
}

/* ── exam hero ─────────────────────────────────────────────────────── */
function ExamHero({
  exam,
  seatsLeft,
  examStart,
  examEnd,
}: {
  exam: any;
  seatsLeft: number | undefined;
  examStart: number | null;
  examEnd: number | null;
}) {
  const isFull = seatsLeft != null && seatsLeft <= 0;
  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <StatusBadge status={exam.status} />
          {exam.mode && <Badge tone="brand">{exam.mode}</Badge>}
          {exam.registrationType === "OPEN" && <Badge tone="success">Open registration</Badge>}
        </div>
        <h1 className="text-2xl font-bold leading-snug">{exam.title}</h1>
        {exam.description && <p className="mt-2 text-muted">{exam.description}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {exam.durationSeconds && (
          <InfoCard icon={<Timer className="h-4 w-4 text-brand" />} label="Duration" value={`${Math.round(exam.durationSeconds / 60)} minutes`} />
        )}
        {exam.startAt && (
          <InfoCard icon={<Calendar className="h-4 w-4 text-brand" />} label="Starts" value={fmtDate(exam.startAt)} />
        )}
        {exam.endAt && (
          <InfoCard icon={<Clock className="h-4 w-4 text-brand" />} label="Closes" value={fmtDate(exam.endAt)} />
        )}
        {exam.seatCap != null && (
          <InfoCard
            icon={<Users className="h-4 w-4 text-brand" />}
            label="Capacity"
            value={isFull ? "Full" : seatsLeft != null ? `${seatsLeft} of ${exam.seatCap} left` : `${exam.seatCap} seats`}
            valueTone={isFull ? "danger" : seatsLeft != null && seatsLeft < 10 ? "warning" : "success"}
          />
        )}
      </div>

      {exam.seatCap != null && exam.enrolledCount != null && (
        <SeatBar cap={exam.seatCap} enrolled={exam.enrolledCount} />
      )}

      {exam.startAt && examStart != null && examStart > 0 && exam.status === "SCHEDULED" && (
        <div className="flex items-center gap-3 rounded-xl border border-brand bg-brand-soft px-4 py-3">
          <Zap className="h-5 w-5 shrink-0 text-brand" />
          <div>
            <p className="text-xs font-semibold uppercase text-brand">Exam starts in</p>
            <p className="text-lg font-bold tabular-nums text-brand">{fmtCountdown(examStart)}</p>
          </div>
        </div>
      )}

      {exam.endAt && examEnd != null && examEnd > 0 && exam.status === "LIVE" && (
        <div className="flex items-center gap-3 rounded-xl border border-success bg-success-soft px-4 py-3">
          <Zap className="h-5 w-5 shrink-0 text-success" />
          <div>
            <p className="text-xs font-semibold uppercase text-success">Registration closes in</p>
            <p className="text-lg font-bold tabular-nums text-success">{fmtCountdown(examEnd)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
export default function PublicRegister() {
  const { examId } = useParams<{ examId: string }>();
  const { data: exam, isLoading, isError } = useExam(examId);
  const signIn = useAuth((s) => s.signIn);
  const claims = useAuth((s) => s.claims);
  const { data: myStatus, isLoading: statusLoading } = useMyExamStatus(examId, !!claims);

  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [enrolResult, setEnrolResult] = useState<string>("");
  const [error, setError] = useState("");
  const [resendIn, setResendIn] = useState(0);

  const examStart = useCountdown(exam?.startAt);
  const examEnd = useCountdown(exam?.endAt);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setInterval(() => setResendIn((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  const requestOtp = useMutation({
    mutationFn: () => authApi.requestOtp(email),
    onSuccess: () => {
      setStep("otp");
      setResendIn(60);
      setError("");
      toast.success("OTP sent", `Check ${email} for your 6-digit code.`);
    },
    onError: (e: ApiError) => setError(e.message ?? "Failed to send OTP"),
  });

  const verifyAndRegister = useMutation({
    mutationFn: async () => {
      const tokens = await authApi.verifyOtp(email, otp);
      signIn(tokens.accessToken, tokens.refreshToken);
      return enrolmentApi.selfRegister(examId, { name, email, phone: phone || undefined });
    },
    onSuccess: (res) => {
      setEnrolResult(res.status);
      setStep("done");
    },
    onError: (e: ApiError) => {
      const msg = e.message ?? "Verification failed";
      setError(msg);
      if (msg.toLowerCase().includes("otp") || msg.toLowerCase().includes("invalid")) setOtp("");
    },
  });

  /* ── loading ── */
  if (isLoading || statusLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted">
          <Spinner className="h-8 w-8" />
          <p className="text-sm">Loading exam details…</p>
        </div>
      </div>
    );
  }

  /* ── not found ── */
  if (isError || !exam) {
    return (
      <div className="mx-auto max-w-lg">
        <StatusScreen
          icon={<AlertTriangle className="h-10 w-10 text-danger" />}
          title="Exam not found"
          subtitle="This registration link may be invalid or the exam has been removed."
        />
      </div>
    );
  }

  const seatsLeft = exam.seatCap != null && exam.enrolledCount != null
    ? exam.seatCap - exam.enrolledCount
    : undefined;
  const isFull = seatsLeft != null && seatsLeft <= 0;

  /* ── already completed ── */
  if (myStatus?.sessionStatus && ["SUBMITTED", "EXPIRED", "ABANDONED"].includes(myStatus.sessionStatus)) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <ExamHero exam={exam} seatsLeft={seatsLeft} examStart={examStart} examEnd={examEnd} />
        <div className="rounded-2xl border border-border bg-surface p-8">
          <StatusScreen icon={<Trophy className="h-10 w-10 text-warning" />} title="Exam Completed" subtitle="You have already submitted this exam. Your responses are being graded.">
            <div className="mt-4">
              {exam.status === "RESULTS_PUBLISHED" ? (
                <Button onClick={() => (window.location.href = `/board/${examId}`)}>
                  <Trophy className="h-4 w-4" /> View scoreboard
                </Button>
              ) : (
                <p className="rounded-xl bg-surface-2 px-5 py-3 text-sm text-muted">
                  Results will be published once grading is complete.
                </p>
              )}
            </div>
          </StatusScreen>
        </div>
      </div>
    );
  }

  /* ── already enrolled ── */
  if (myStatus?.enrolmentStatus === "ENROLLED" && !myStatus?.sessionStatus) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <ExamHero exam={exam} seatsLeft={seatsLeft} examStart={examStart} examEnd={examEnd} />
        <div className="rounded-2xl border border-success bg-surface p-8">
          <StatusScreen icon={<CheckCircle2 className="h-10 w-10 text-success" />} title="You're registered!" subtitle={`You're all set for ${exam.title}. Join on time and keep your login handy.`}>
            <div className="mt-4 w-full max-w-xs space-y-3">
              {exam.startAt && examStart != null && examStart > 0 && (
                <div className="rounded-xl bg-brand-soft px-5 py-4 text-center">
                  <p className="text-xs font-semibold uppercase text-brand">Starts in</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-brand">{fmtCountdown(examStart)}</p>
                </div>
              )}
              {exam.startAt && (
                <p className="text-center text-sm text-muted">
                  <Calendar className="mr-1 inline-block h-3.5 w-3.5" />
                  {fmtDate(exam.startAt)}
                </p>
              )}
            </div>
          </StatusScreen>
        </div>
      </div>
    );
  }

  /* ── waitlisted ── */
  if (myStatus?.enrolmentStatus === "WAITLISTED") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <ExamHero exam={exam} seatsLeft={seatsLeft} examStart={examStart} examEnd={examEnd} />
        <div className="rounded-2xl border border-warning bg-surface p-8">
          <StatusScreen icon={<Clock className="h-10 w-10 text-warning" />} title="You're on the waitlist" subtitle="We'll notify you by email if a seat opens up. No action needed from your side.">
            {exam.seatCap != null && exam.enrolledCount != null && (
              <div className="mt-4 w-full max-w-xs">
                <SeatBar cap={exam.seatCap} enrolled={exam.enrolledCount} />
              </div>
            )}
          </StatusScreen>
        </div>
      </div>
    );
  }

  /* ── pre-registered ── */
  if (exam.registrationType !== "OPEN") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <ExamHero exam={exam} seatsLeft={seatsLeft} examStart={examStart} examEnd={examEnd} />
        <div className="rounded-2xl border border-border bg-surface p-8">
          <StatusScreen icon={<Lock className="h-10 w-10 text-muted" />} title="Pre-registered exam" subtitle="This exam requires an invitation. Contact your examiner to be added to the candidate roster." />
        </div>
      </div>
    );
  }

  /* ── closed / draft / cancelled ── */
  if (!["LIVE", "SCHEDULED"].includes(exam.status)) {
    const config: Record<string, { icon: React.ReactNode; title: string; sub: string }> = {
      DRAFT: { icon: <BookOpen className="h-10 w-10 text-muted" />, title: "Not published yet", sub: "This exam hasn't been opened for registration. Check back later." },
      CLOSED: { icon: <Lock className="h-10 w-10 text-warning" />, title: "Registration closed", sub: "The registration window for this exam has ended." },
      RESULTS_PUBLISHED: { icon: <Trophy className="h-10 w-10 text-warning" />, title: "Exam concluded", sub: "This exam has ended and results have been published." },
      CANCELLED: { icon: <AlertTriangle className="h-10 w-10 text-danger" />, title: "Exam cancelled", sub: "This exam has been cancelled by the organiser." },
    };
    const c = config[exam.status] ?? { icon: <GraduationCap className="h-10 w-10 text-muted" />, title: "Unavailable", sub: "Registration is not available at this time." };
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <ExamHero exam={exam} seatsLeft={seatsLeft} examStart={examStart} examEnd={examEnd} />
        <div className="rounded-2xl border border-border bg-surface p-8">
          <StatusScreen icon={c.icon} title={c.title} subtitle={c.sub}>
            {exam.status === "RESULTS_PUBLISHED" && (
              <Button className="mt-4" onClick={() => (window.location.href = `/board/${examId}`)}>
                <Trophy className="h-4 w-4" /> View scoreboard
              </Button>
            )}
          </StatusScreen>
        </div>
      </div>
    );
  }

  /* ── registration form ── */
  return (
    <div className="mx-auto max-w-4xl">
      <div className="grid gap-8 lg:grid-cols-[1fr_420px]">

        {/* Left — exam details */}
        <ExamHero exam={exam} seatsLeft={seatsLeft} examStart={examStart} examEnd={examEnd} />

        {/* Right — form card */}
        <div className="rounded-2xl border border-border bg-surface shadow-sm">
          {/* Card header */}
          <div className="border-b border-border px-6 py-5">
            <p className="text-lg font-semibold">
              {step === "details" ? (isFull ? "Join the waitlist" : "Register for this exam")
                : step === "otp" ? "Verify your email"
                : "Registration complete"}
            </p>
            {step === "details" && (
              <p className="mt-0.5 text-sm text-muted">
                {isFull ? "Register below to join the waitlist." : "Fill in your details and verify with a one-time code."}
              </p>
            )}
          </div>

          <div className="p-6">
            {/* Step indicators */}
            {step !== "done" && (
              <div className="mb-6 flex items-center gap-2">
                {(["details", "otp"] as Step[]).map((s, i) => (
                  <React.Fragment key={s}>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors",
                        step === s || (s === "details" && step === "otp")
                          ? "bg-brand text-white"
                          : "bg-surface-2 text-muted",
                      )}>
                        {s === "details" && step === "otp" ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                      </div>
                      <span className={cn("text-xs font-medium", step === s ? "text-fg" : "text-muted")}>
                        {s === "details" ? "Details" : "Verify"}
                      </span>
                    </div>
                    {i < 1 && <div className="h-px w-8 bg-border" />}
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Step 1 — Details */}
            {step === "details" && (
              <form onSubmit={(e) => { e.preventDefault(); setError(""); requestOtp.mutate(); }} className="space-y-4">
                {isFull && (
                  <div className="rounded-xl bg-warning-soft px-4 py-3">
                    <p className="text-sm font-medium text-warning">This exam is full</p>
                    <p className="mt-0.5 text-xs text-warning">
                      You&apos;ll be added to the waitlist and notified if a seat opens.
                    </p>
                  </div>
                )}

                <Field label="Full name">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Sharma" className="pl-9" required autoFocus />
                  </div>
                </Field>

                <Field label="Email address" hint="A one-time code will be sent here.">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="pl-9" required />
                  </div>
                </Field>

                <Field label="Phone number" hint="Optional — for exam day reminders.">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className="pl-9" />
                  </div>
                </Field>

                {error && (
                  <div className="flex items-start gap-2 rounded-xl bg-danger-soft px-4 py-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                    <p className="text-sm text-danger">{error}</p>
                  </div>
                )}

                <Button type="submit" className="w-full" size="lg" loading={requestOtp.isPending} disabled={!name.trim() || !email.trim()}>
                  {isFull ? "Join waitlist →" : "Continue →"}
                </Button>
                <p className="text-center text-xs text-muted">
                  By registering you agree to the exam terms and privacy policy.
                </p>
              </form>
            )}

            {/* Step 2 — OTP */}
            {step === "otp" && (
              <div className="space-y-5">
                <div className="rounded-xl bg-surface-2 px-4 py-3 text-sm">
                  Code sent to <span className="font-semibold text-fg">{email}</span>
                </div>

                <Field label="One-time code">
                  <Input
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setError(""); }}
                    placeholder="• • • • • •"
                    className="text-center text-3xl font-bold tracking-[0.6em]"
                    autoFocus
                  />
                </Field>

                {error && (
                  <div className="flex items-start gap-2 rounded-xl bg-danger-soft px-4 py-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                    <p className="text-sm text-danger">{error}</p>
                  </div>
                )}

                <Button className="w-full" size="lg" disabled={otp.length !== 6} loading={verifyAndRegister.isPending}
                  onClick={() => { setError(""); verifyAndRegister.mutate(); }}>
                  <CheckCircle2 className="h-4 w-4" /> Verify &amp; register
                </Button>

                <div className="flex items-center justify-between">
                  <button type="button"
                    onClick={() => { setStep("details"); setOtp(""); setError(""); }}
                    className="flex items-center gap-1 text-sm text-muted transition-colors hover:text-fg">
                    <ArrowLeft className="h-3.5 w-3.5" /> Change email
                  </button>
                  <button type="button"
                    disabled={resendIn > 0 || requestOtp.isPending}
                    onClick={() => { setError(""); setOtp(""); requestOtp.mutate(); }}
                    className="flex items-center gap-1 text-sm text-brand hover:underline disabled:cursor-not-allowed disabled:opacity-50">
                    <RefreshCw className="h-3.5 w-3.5" />
                    {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 — Done */}
            {step === "done" && (
              <div className="py-2 text-center">
                {enrolResult === "ENROLLED" ? (
                  <StatusScreen icon={<CheckCircle2 className="h-12 w-12 text-success" />} title="You're registered!" subtitle={`You've been enrolled in ${exam.title}.`}>
                    <div className="mt-4 w-full space-y-3">
                      {exam.startAt && examStart != null && examStart > 0 && (
                        <div className="rounded-xl bg-brand-soft px-5 py-4 text-center">
                          <p className="text-xs font-semibold uppercase text-brand">Starts in</p>
                          <p className="mt-1 text-2xl font-bold tabular-nums text-brand">{fmtCountdown(examStart)}</p>
                        </div>
                      )}
                      {exam.startAt && (
                        <p className="text-sm text-muted">
                          <Calendar className="mr-1 inline-block h-3.5 w-3.5" />
                          {fmtDate(exam.startAt)}
                        </p>
                      )}
                    </div>
                  </StatusScreen>
                ) : (
                  <StatusScreen icon={<Clock className="h-12 w-12 text-warning" />} title="Added to waitlist" subtitle={`We'll notify you at ${email} if a seat becomes available.`}>
                    {exam.seatCap != null && exam.enrolledCount != null && (
                      <div className="mt-4 w-full max-w-xs">
                        <SeatBar cap={exam.seatCap} enrolled={exam.enrolledCount} />
                      </div>
                    )}
                  </StatusScreen>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
