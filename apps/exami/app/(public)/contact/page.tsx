import type { Metadata } from "next";
import { Mail, MessageSquare, Clock, ShieldCheck, BookOpen } from "lucide-react";
import { ContactForm } from "@/components/public/contact-form";

export const metadata: Metadata = {
  title: "Contact — Exami",
  description:
    "Get in touch with the Exami team for demos, pricing, technical support or general enquiries.",
};

const CHANNELS = [
  {
    icon: Mail,
    title: "Email us",
    value: "support@exami.edu",
    href: "mailto:support@exami.edu",
    desc: "For support and general questions.",
  },
  {
    icon: MessageSquare,
    title: "Talk to sales",
    value: "sales@exami.edu",
    href: "mailto:sales@exami.edu",
    desc: "Rolling Exami out across an institution.",
  },
];

const ASSURANCES = [
  { icon: Clock, text: "Replies within one business day" },
  { icon: ShieldCheck, text: "Your details are never shared" },
  { icon: BookOpen, text: "Check the FAQ for instant answers" },
];

export default function ContactPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">
          Contact
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Let&apos;s talk
        </h1>
        <p className="mt-4 text-muted">
          Questions about running exams on Exami, or want a walkthrough for your
          institution? Send us a note and we&apos;ll get back to you.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        {/* Left — channels */}
        <aside className="space-y-4">
          {CHANNELS.map((c) => (
            <a
              key={c.title}
              href={c.href}
              className="block rounded-2xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-brand"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <c.icon className="h-5 w-5" />
              </div>
              <h2 className="font-semibold">{c.title}</h2>
              <p className="mt-0.5 text-sm font-medium text-brand">{c.value}</p>
              <p className="mt-1 text-sm text-muted">{c.desc}</p>
            </a>
          ))}

          <div className="rounded-2xl border border-border bg-surface-2 p-5">
            <ul className="space-y-3">
              {ASSURANCES.map((a) => (
                <li key={a.text} className="flex items-center gap-2.5 text-sm">
                  <a.icon className="h-4 w-4 shrink-0 text-success" />
                  <span className="text-muted">{a.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Right — form */}
        <ContactForm />
      </div>
    </div>
  );
}
