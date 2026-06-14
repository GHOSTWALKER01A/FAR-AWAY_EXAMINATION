import type { Metadata } from "next";
import Link from "next/link";
import {
  UserPlus,
  MailCheck,
  Clock,
  MonitorCheck,
  Trophy,
  PencilRuler,
  CalendarClock,
  Eye,
  FileCheck2,
  Send,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "How it works — Exami",
  description:
    "From registration to results — see exactly how candidates sit exams and how examiners run them on Exami.",
};

type Step = { icon: typeof UserPlus; title: string; desc: string };

const CANDIDATE_STEPS: Step[] = [
  { icon: UserPlus, title: "Register", desc: "Open your exam link, enter your details and request a one-time code." },
  { icon: MailCheck, title: "Verify", desc: "Confirm the 6-digit code sent to your email — no password to remember." },
  { icon: Clock, title: "Get ready", desc: "Track a live countdown, your seat status and everything you need to know." },
  { icon: MonitorCheck, title: "Sit the exam", desc: "Answer in a calm, autosaving runner. A dropped connection never loses work." },
  { icon: Trophy, title: "See results", desc: "View your rank, score and percentile the moment results are published." },
];

const EXAMINER_STEPS: Step[] = [
  { icon: PencilRuler, title: "Build", desc: "Author questions or import them in bulk, then assemble papers or adaptive sets." },
  { icon: CalendarClock, title: "Schedule", desc: "Set the window, duration, seat cap and registration type for your exam." },
  { icon: Eye, title: "Proctor", desc: "Monitor live sessions, review risk flags and intervene when needed." },
  { icon: FileCheck2, title: "Grade", desc: "Auto-grade objective items and confirm AI suggestions for subjective ones." },
  { icon: Send, title: "Publish", desc: "Release transparent, ranked results and handle any grievances with a full audit trail." },
];

function Track({
  tag,
  steps,
}: {
  tag: string;
  steps: Step[];
}) {
  return (
    <div>
      <p className="mb-6 inline-flex rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand">
        {tag}
      </p>
      <ol className="relative space-y-6 border-l border-border pl-8">
        {steps.map((s, i) => (
          <li key={s.title} className="relative">
            <span className="absolute left-[-2.55rem] flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-brand shadow-sm">
              <s.icon className="h-4 w-4" />
            </span>
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tabular-nums text-muted">
                  Step {i + 1}
                </span>
                <h3 className="font-semibold">{s.title}</h3>
              </div>
              <p className="mt-1.5 text-sm text-muted">{s.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="space-y-20">
      {/* Header */}
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">
          How it works
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Two journeys, one platform
        </h1>
        <p className="mt-4 text-muted">
          Whether you&apos;re sitting an exam or running one, Exami keeps each step
          simple, secure and clear.
        </p>
      </header>

      {/* Tracks */}
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-10">
        <Track tag="For candidates" steps={CANDIDATE_STEPS} />
        <Track tag="For examiners" steps={EXAMINER_STEPS} />
      </div>

      {/* CTA */}
      <section className="overflow-hidden rounded-4xl bg-brand px-6 py-14 text-center text-white sm:px-16">
        <h2 className="text-3xl font-bold tracking-tight">
          Start in minutes
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-white/80">
          Sign in to set up your first exam, or reach out and we&apos;ll help you
          get your institution onboarded.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-6 text-base font-medium text-brand transition-opacity hover:opacity-90"
          >
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/faq"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/40 px-6 text-base font-medium text-white transition-colors hover:bg-white/10"
          >
            Read the FAQ
          </Link>
        </div>
      </section>
    </div>
  );
}
