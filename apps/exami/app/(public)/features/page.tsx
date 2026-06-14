import type { Metadata } from "next";
import Link from "next/link";
import {
  Eye,
  Brain,
  FileCheck2,
  ShieldCheck,
  Trophy,
  Gauge,
  MessageSquareWarning,
  ClipboardList,
  Bell,
  Lock,
  Activity,
  Camera,
  ScrollText,
  BarChart3,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Features — Exami",
  description:
    "Live proctoring, adaptive testing, AI-assisted grading, tamper-proof security and transparent scoreboards — everything Exami offers.",
};

type Feature = { icon: typeof Eye; title: string; desc: string };

const SECTIONS: {
  id: string;
  eyebrow: string;
  title: string;
  intro: string;
  features: Feature[];
}[] = [
  {
    id: "proctoring",
    eyebrow: "Integrity",
    title: "Live proctoring & monitoring",
    intro:
      "Keep every exam fair with real-time invigilation built for scale. Proctors see what matters and nothing they don't.",
    features: [
      { icon: Eye, title: "Live candidate grid", desc: "Watch active sessions update in real time over WebSockets." },
      { icon: Activity, title: "Automated risk scoring", desc: "Suspicious behaviour is flagged and ranked so proctors focus where it counts." },
      { icon: Camera, title: "Snapshots & evidence", desc: "Capture timestamped evidence attached to each candidate's timeline." },
      { icon: Bell, title: "Instant interventions", desc: "Warn, pause or terminate a session the moment something looks off." },
    ],
  },
  {
    id: "assessment",
    eyebrow: "Assessment",
    title: "Adaptive testing & question banks",
    intro:
      "Author once, reuse everywhere. Run fixed papers or adaptive tests that find a candidate's true ability faster.",
    features: [
      { icon: Brain, title: "Adaptive engine", desc: "Difficulty adjusts per response to measure ability with fewer items." },
      { icon: ClipboardList, title: "Rich question bank", desc: "MCQ, multi-select, numeric and subjective questions with tagging." },
      { icon: FileCheck2, title: "Bulk & AI import", desc: "Import questions in bulk or generate drafts with AI, then review." },
      { icon: Gauge, title: "Flexible scheduling", desc: "Windows, durations, seat caps and waitlists — all configurable." },
    ],
  },
  {
    id: "grading",
    eyebrow: "Grading",
    title: "AI-assisted, examiner-controlled grading",
    intro:
      "Objective items grade instantly. For subjective answers, rubric-aware AI proposes scores that examiners confirm or override.",
    features: [
      { icon: FileCheck2, title: "Rubric-aware scoring", desc: "Consistent suggestions grounded in your marking scheme." },
      { icon: MessageSquareWarning, title: "Grievance workflow", desc: "Candidates raise disputes; examiners resolve them with an audit trail." },
      { icon: BarChart3, title: "Score analytics", desc: "Distributions, percentiles and pass rates computed automatically." },
      { icon: Trophy, title: "One-click publishing", desc: "Release ranked results to a public scoreboard when you're ready." },
    ],
  },
  {
    id: "security",
    eyebrow: "Security",
    title: "Tamper-proof by design",
    intro:
      "Security is not a setting — it's the foundation. Every action is authenticated, authorised and recorded.",
    features: [
      { icon: Lock, title: "Single active session", desc: "Device binding stops shared logins and concurrent attempts." },
      { icon: ShieldCheck, title: "Fine-grained permissions", desc: "Role-based access for admins, examiners and invigilators." },
      { icon: ScrollText, title: "Append-only audit log", desc: "An immutable record of who did what, and when." },
      { icon: Activity, title: "Resilient autosave", desc: "Answers persist continuously, so a dropped connection never loses work." },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="space-y-20">
      {/* Header */}
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">
          Features
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          One platform, every part of the exam
        </h1>
        <p className="mt-4 text-muted">
          From the first question authored to the final rank published —
          here&apos;s everything Exami handles for you.
        </p>
      </header>

      {/* Sections */}
      {SECTIONS.map((s, i) => (
        <section key={s.id} id={s.id} className="scroll-mt-24">
          <div
            className={cn(
              "grid items-start gap-8 lg:grid-cols-[1fr_2fr]",
              i % 2 === 1 && "lg:grid-cols-[2fr_1fr]",
            )}
          >
            <div className={cn(i % 2 === 1 && "lg:order-last")}>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                {s.eyebrow}
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">{s.title}</h2>
              <p className="mt-3 text-sm text-muted">{s.intro}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {s.features.map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Comparison strip */}
      <section className="rounded-4xl border border-border bg-surface-2 p-8 sm:p-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            Why teams choose Exami
          </h2>
        </div>
        <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
          {[
            "No software to install — runs in any modern browser",
            "Scales from 20 to 20,000 candidates without re-architecting",
            "Transparent rankings build candidate trust",
            "Audit-ready logs for every exam and decision",
            "Accessible, distraction-free exam experience",
            "Examiners stay in control of every grade",
          ].map((p) => (
            <div key={p} className="flex items-start gap-2.5 rounded-xl bg-surface p-4 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <span>{p}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="flex flex-col items-center justify-between gap-5 rounded-2xl border border-border bg-surface p-8 text-center shadow-sm sm:flex-row sm:text-left">
        <div>
          <h2 className="text-xl font-bold">See it in action</h2>
          <p className="mt-1 text-sm text-muted">
            Walk through the candidate and examiner journeys step by step.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link href="/how-it-works" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
            How it works
          </Link>
          <Link href="/login" className={cn(buttonVariants({ variant: "primary", size: "lg" }))}>
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
