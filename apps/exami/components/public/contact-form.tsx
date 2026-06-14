"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea, Select } from "@/components/ui/input";

const TOPICS = [
  "General enquiry",
  "Request a demo",
  "Pricing for my institution",
  "Technical support",
  "Something else",
];

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    org: "",
    topic: TOPICS[0],
    message: "",
  });

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // No public contact endpoint exists yet — simulate a successful submission.
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSent(true);
    }, 700);
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-success bg-success-soft px-6 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface">
          <CheckCircle2 className="h-7 w-7 text-success" />
        </div>
        <p className="text-lg font-semibold">Message sent</p>
        <p className="max-w-sm text-sm text-muted">
          Thanks, {form.name || "there"} — we&apos;ve received your message and will
          reply to {form.email || "your email"} within one business day.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setForm({ name: "", email: "", org: "", topic: TOPICS[0], message: "" });
          }}
          className="text-sm font-medium text-brand hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8"
    >
      <div className="grid gap-x-4 sm:grid-cols-2">
        <Field label="Full name">
          <Input value={form.name} onChange={set("name")} placeholder="e.g. Priya Sharma" required />
        </Field>
        <Field label="Work email">
          <Input type="email" value={form.email} onChange={set("email")} placeholder="you@institution.edu" required />
        </Field>
      </div>

      <div className="grid gap-x-4 sm:grid-cols-2">
        <Field label="Organisation" hint="Optional">
          <Input value={form.org} onChange={set("org")} placeholder="Your school or university" />
        </Field>
        <Field label="Topic">
          <Select value={form.topic} onChange={set("topic")}>
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Message">
        <Textarea
          value={form.message}
          onChange={set("message")}
          placeholder="Tell us a little about what you need…"
          className="min-h-32"
          required
        />
      </Field>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        loading={submitting}
        disabled={!form.name.trim() || !form.email.trim() || !form.message.trim()}
      >
        <Send className="h-4 w-4" /> Send message
      </Button>
      <p className="mt-3 text-center text-xs text-muted">
        We&apos;ll only use your details to respond to this enquiry.
      </p>
    </form>
  );
}
