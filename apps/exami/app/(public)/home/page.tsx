import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Brain,
  Eye,
  Trophy,
  Gauge,
  FileCheck2,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Users,
  Clock,
  Lock,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Exami — Secure online examinations, done right",
  description:
    "Adaptive testing, AI-assisted grading and live proctoring in one secure platform. Run fair, transparent exams at any scale.",
};

const STATS = [
  { value: "99.9%", label: "Uptime during exams" },
  { value: "<150ms", label: "Answer autosave" },
  { value: "256-bit", label: "Encryption in transit" },
  { value: "24/7", label: "Proctor support" },
];

const FEATURES = [
  {
    icon: Eye,
    title: "Live proctoring",
    desc: "Real-time invigilation with risk scoring, snapshots and full event timelines for every candidate.",
  },
  {
    icon: Brain,
    title: "Adaptive testing",
    desc: "Item-response engine that adjusts difficulty on the fly to measure ability with fewer questions.",
  },
  {
    icon: FileCheck2,
    title: "AI-assisted grading",
    desc: "Subjective answers scored consistently with rubric-aware models — examiners stay in control.",
  },
  {
    icon: ShieldCheck,
    title: "Tamper-proof security",
    desc: "Single-active-session enforcement, device binding and a signed, append-only audit log.",
  },
  {
    icon: Trophy,
    title: "Live scoreboards",
    desc: "Publish ranked results with percentiles, pass rates and score distributions in one click.",
  },
  {
    icon: Gauge,
    title: "Built to scale",
    desc: "From a classroom quiz to a national entrance test, the platform stays fast under load.",
  },
];

const AUDIENCES = [
  {
    tag: "For candidates",
    points: [
      "Register in seconds with a one-time email code",
      "A calm, distraction-free exam runner with autosave",
      "Live countdowns, seat tracking and instant results",
    ],
    href: "/how-it-works",
    cta: "See the candidate flow",
  },
  {
    tag: "For examiners",
    points: [
      "Build question banks or import in bulk",
      "Schedule, proctor and grade from one dashboard",
      "Resolve grievances and publish transparent rankings",
    ],
    href: "/features",
    cta: "Explore examiner tools",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-24">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-4xl border border-border bg-gradient-to-br from-brand-soft via-surface to-surface px-6 py-16 text-center sm:px-12 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-brand">
            <Sparkles className="h-3.5 w-3.5" />
            FAR AWAY 2026 · Secure examination platform
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Online exams that are{" "}
            <span className="animate-brand-text">secure, fair</span> and{" "}
            <span className="animate-brand-text">transparent</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted sm:text-lg">
            Exami brings adaptive testing, AI-assisted grading and live
            proctoring together so institutions can run trustworthy assessments
            at any scale — and candidates can focus on what matters.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "primary", size: "lg" }))}
            >
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/how-it-works"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              See how it works
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-success" /> End-to-end encrypted
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-success" /> Proctored
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" /> No card
              required
            </span>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-border bg-surface-2 p-5 text-center"
          >
            <p className="text-3xl font-bold tabular-nums text-brand">{s.value}</p>
            <p className="mt-1 text-xs text-muted">{s.label}</p>
          </div>
        ))}
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Everything you need to run an exam
          </h2>
          <p className="mt-3 text-muted">
            A complete toolkit for institutions — from authoring questions to
            publishing results.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:border-brand hover:shadow-md"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/features"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
          >
            Browse all features <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Audiences ────────────────────────────────────────── */}
      <section className="grid gap-5 lg:grid-cols-2">
        {AUDIENCES.map((a) => (
          <div
            key={a.tag}
            className="flex flex-col rounded-2xl border border-border bg-surface p-8 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">
              {a.tag}
            </p>
            <ul className="mt-5 flex-1 space-y-3">
              {a.points.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <Link
              href={a.href}
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
            >
              {a.cta} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ))}
      </section>

      {/* ── Testimonial ──────────────────────────────────────── */}
      <section className="rounded-4xl border border-border bg-surface-2 px-6 py-14 text-center sm:px-16">
        <Users className="mx-auto h-8 w-8 text-brand" />
        <blockquote className="mx-auto mt-5 max-w-2xl text-xl font-medium leading-relaxed sm:text-2xl">
          “We moved our entrance test of 12,000 candidates to Exami. Zero
          downtime, transparent rankings and grievances resolved in days, not
          weeks.”
        </blockquote>
        <p className="mt-5 text-sm text-muted">
          Controller of Examinations · Demo University
        </p>
      </section>

      {/* ── CTA banner ───────────────────────────────────────── */}
      <section className="overflow-hidden rounded-4xl bg-brand px-6 py-14 text-center text-white sm:px-16">
        <Clock className="mx-auto h-8 w-8 opacity-90" />
        <h2 className="mt-4 text-3xl font-bold tracking-tight">
          Ready to run your next exam?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-white/80">
          Sign in to schedule an exam, or talk to us about rolling Exami out
          across your institution.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-6 text-base font-medium text-brand transition-opacity hover:opacity-90"
          >
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/40 px-6 text-base font-medium text-white transition-colors hover:bg-white/10"
          >
            Contact sales
          </Link>
        </div>
      </section>
    </div>
  );
}
