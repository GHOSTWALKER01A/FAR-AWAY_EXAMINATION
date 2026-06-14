import type { Metadata } from "next";
import Link from "next/link";
import { LifeBuoy, ArrowRight } from "lucide-react";
import { FaqAccordion, type FaqItem } from "@/components/public/faq-accordion";

export const metadata: Metadata = {
  title: "FAQ — Exami",
  description:
    "Answers to common questions about registering for exams, proctoring, results and security on Exami.",
};

const GROUPS: { heading: string; items: FaqItem[] }[] = [
  {
    heading: "Registering & signing in",
    items: [
      {
        q: "How do I register for an exam?",
        a: "Open the registration link shared by your institution, enter your details, and verify with the one-time 6-digit code sent to your email. If the exam is full you'll be added to the waitlist automatically.",
      },
      {
        q: "Do I need a password?",
        a: "Candidates sign in with a one-time code sent to their email — there's no password to remember. Staff accounts (examiners, proctors, admins) sign in with their institutional credentials.",
      },
      {
        q: "What if the exam is full?",
        a: "You can still register to join the waitlist. We'll email you the moment a seat opens up, and your place is held in the order you joined.",
      },
    ],
  },
  {
    heading: "During the exam",
    items: [
      {
        q: "What happens if my internet drops?",
        a: "Your answers autosave continuously, so a brief disconnection won't lose your work. When you reconnect, the exam resumes exactly where you left off — your remaining time keeps counting based on the server clock.",
      },
      {
        q: "How does proctoring work?",
        a: "Live invigilators monitor active sessions in real time. The system flags unusual behaviour with a risk score so proctors can review, warn, or take action when necessary. Everything is recorded in a timeline for transparency.",
      },
      {
        q: "Can I use more than one device at a time?",
        a: "No. Exami enforces a single active session per candidate using device binding, which prevents shared logins and concurrent attempts.",
      },
    ],
  },
  {
    heading: "Results & fairness",
    items: [
      {
        q: "When will I see my results?",
        a: "Results appear on the public scoreboard the moment the examiner publishes them. You'll see your rank, score, percentage and percentile, along with overall statistics for the exam.",
      },
      {
        q: "How is grading done?",
        a: "Objective questions are graded automatically. Subjective answers are scored with rubric-aware AI suggestions that an examiner reviews and confirms — a human always stays in control of the final grade.",
      },
      {
        q: "I think my grade is wrong. What can I do?",
        a: "You can raise a grievance from your result page. Examiners review each dispute and resolve it with a full audit trail, so every decision is traceable.",
      },
    ],
  },
  {
    heading: "Security & privacy",
    items: [
      {
        q: "Is my data secure?",
        a: "All traffic is encrypted in transit with 256-bit TLS. Access is role-based and every sensitive action is written to an append-only audit log that cannot be altered after the fact.",
      },
      {
        q: "Who can see my answers and score?",
        a: "Your answers are visible only to authorised examiners for grading. Scoreboards show ranked results, and what's published is controlled entirely by your institution.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="space-y-14">
      {/* Header */}
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">
          Help center
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Frequently asked questions
        </h1>
        <p className="mt-4 text-muted">
          Everything candidates and examiners ask most. Can&apos;t find your
          answer? We&apos;re a message away.
        </p>
      </header>

      {/* Groups */}
      <div className="space-y-10">
        {GROUPS.map((g) => (
          <section key={g.heading}>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
              {g.heading}
            </h2>
            <FaqAccordion items={g.items} />
          </section>
        ))}
      </div>

      {/* Still need help */}
      <section className="flex flex-col items-center gap-4 rounded-4xl border border-border bg-surface-2 px-6 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand">
          <LifeBuoy className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Still have a question?</h2>
          <p className="mt-1 text-sm text-muted">
            Our support team typically replies within one business day.
          </p>
        </div>
        <Link
          href="/contact"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
        >
          Contact support <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
