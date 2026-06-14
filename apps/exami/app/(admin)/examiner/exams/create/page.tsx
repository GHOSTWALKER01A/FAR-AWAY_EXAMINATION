"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateExam } from "@/lib/hooks/queries";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ExamMode } from "@/lib/types";
import { Check } from "lucide-react";

const STEPS = ["Basics", "Timing", "Marking", "Engine", "Proctoring"];

const MODE_INFO: Record<ExamMode, string> = {
  ADAPTIVE: "IRT-driven. Each question is chosen from the candidate's ability. No going back.",
  FIXED: "Every candidate sees the same questions in the same order.",
  RANDOMISED: "Questions drawn from the bank per a blueprint of topics & difficulty.",
};

export default function CreateExam() {
  const router = useRouter();
  const create = useCreateExam();
  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    title: "",
    description: "",
    mode: "ADAPTIVE" as ExamMode,
    registrationType: "PRE_REGISTERED" as "PRE_REGISTERED" | "OPEN",
    durationMin: 60,
    startAt: "",
    endAt: "",
    publishAt: "",
    seatCap: 100,
    negativePenalty: 0,
    seTarget: 0.3,
    minItems: 10,
    maxItems: 40,
    requireCamera: true,
    tabSwitchWeight: 0.15,
    faceMissingWeight: 0.25,
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    const exam = await create.mutateAsync({
      title: form.title,
      description: form.description || undefined,
      mode: form.mode,
      registrationType: form.registrationType,
      durationSeconds: form.durationMin * 60,
      startAt: form.startAt ? new Date(form.startAt).toISOString() : undefined,
      endAt: form.endAt ? new Date(form.endAt).toISOString() : undefined,
      publishAt: form.publishAt ? new Date(form.publishAt).toISOString() : undefined,
      seatCap: form.seatCap,
      markingConfig: { negativePenalty: form.negativePenalty },
      adaptiveConfig:
        form.mode === "ADAPTIVE"
          ? { seTarget: form.seTarget, minItems: form.minItems, maxItems: form.maxItems }
          : undefined,
      proctoringConfig: {
        requireCamera: form.requireCamera,
        weights: {
          TAB_SWITCH: form.tabSwitchWeight,
          FACE_MISSING: form.faceMissingWeight,
        },
      },
    });
    router.push(`/examiner/exams/${exam.id}`);
  };

  const canNext =
    step !== 0 || (form.title.trim().length > 2);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Create exam" subtitle="Five quick steps to a draft." />

      {/* Stepper */}
      <div className="mb-6 flex items-center justify-between">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                i < step
                  ? "bg-[var(--color-success)] text-white"
                  : i === step
                    ? "bg-[var(--color-brand)] text-white"
                    : "bg-[var(--color-surface-2)] text-[var(--color-muted)]",
              )}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-1 h-0.5 flex-1",
                  i < step ? "bg-[var(--color-success)]" : "bg-[var(--color-border)]",
                )}
              />
            )}
          </div>
        ))}
      </div>
      <p className="mb-4 text-sm font-medium text-[var(--color-muted)]">
        Step {step + 1} of {STEPS.length}: {STEPS[step]}
      </p>

      <Card>
        <CardContent className="pt-5">
          {step === 0 && (
            <>
              <Field label="Title">
                <Input
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. JEE Mock Test 1"
                  autoFocus
                />
              </Field>
              <Field label="Description (optional)">
                <Textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Full syllabus mock"
                />
              </Field>
              <Field label="Exam mode">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {(["ADAPTIVE", "FIXED", "RANDOMISED"] as ExamMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => set("mode", m)}
                      className={cn(
                        "rounded-lg border p-3 text-left text-sm",
                        form.mode === m
                          ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]"
                          : "border-[var(--color-border)] hover:bg-[var(--color-surface-2)]",
                      )}
                    >
                      <p className="font-semibold">{m}</p>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-[var(--color-muted)]">
                  {MODE_INFO[form.mode]}
                </p>
              </Field>
              <Field label="Registration">
                <Select
                  value={form.registrationType}
                  onChange={(e) => set("registrationType", e.target.value as "PRE_REGISTERED" | "OPEN")}
                >
                  <option value="PRE_REGISTERED">Pre-registered (roster)</option>
                  <option value="OPEN">Open / self-register</option>
                </Select>
              </Field>
            </>
          )}

          {step === 1 && (
            <>
              <Field label="Duration (minutes)">
                <Input
                  type="number"
                  value={form.durationMin}
                  onChange={(e) => set("durationMin", Number(e.target.value))}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Opens at">
                  <Input
                    type="datetime-local"
                    value={form.startAt}
                    onChange={(e) => set("startAt", e.target.value)}
                  />
                </Field>
                <Field label="Closes at">
                  <Input
                    type="datetime-local"
                    value={form.endAt}
                    onChange={(e) => set("endAt", e.target.value)}
                  />
                </Field>
              </div>
              <Field
                label="Scheduled publish (optional)"
                hint="If set, the exam auto-goes-live at this time."
              >
                <Input
                  type="datetime-local"
                  value={form.publishAt}
                  onChange={(e) => set("publishAt", e.target.value)}
                />
              </Field>
              <Field label="Seat cap">
                <Input
                  type="number"
                  value={form.seatCap}
                  onChange={(e) => set("seatCap", Number(e.target.value))}
                />
              </Field>
            </>
          )}

          {step === 2 && (
            <Field
              label="Negative marking penalty"
              hint="Fraction of marks deducted per wrong answer (0 = none)."
            >
              <Input
                type="number"
                step="0.05"
                value={form.negativePenalty}
                onChange={(e) => set("negativePenalty", Number(e.target.value))}
              />
            </Field>
          )}

          {step === 3 && (
            <>
              {form.mode === "ADAPTIVE" ? (
                <>
                  <Field
                    label="Target standard error (seTarget)"
                    hint="Lower = more precise but more questions."
                  >
                    <Input
                      type="number"
                      step="0.05"
                      value={form.seTarget}
                      onChange={(e) => set("seTarget", Number(e.target.value))}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Min items">
                      <Input
                        type="number"
                        value={form.minItems}
                        onChange={(e) => set("minItems", Number(e.target.value))}
                      />
                    </Field>
                    <Field label="Max items">
                      <Input
                        type="number"
                        value={form.maxItems}
                        onChange={(e) => set("maxItems", Number(e.target.value))}
                      />
                    </Field>
                  </div>
                </>
              ) : (
                <p className="py-6 text-center text-sm text-[var(--color-muted)]">
                  {form.mode} mode uses the question set you attach after
                  creating the exam. No engine tuning needed here.
                </p>
              )}
            </>
          )}

          {step === 4 && (
            <>
              <Field label="Require camera">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.requireCamera}
                    onChange={(e) => set("requireCamera", e.target.checked)}
                    className="h-4 w-4"
                  />
                  Candidates must grant camera access to start.
                </label>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tab-switch weight">
                  <Input
                    type="number"
                    step="0.05"
                    value={form.tabSwitchWeight}
                    onChange={(e) => set("tabSwitchWeight", Number(e.target.value))}
                  />
                </Field>
                <Field label="Face-missing weight">
                  <Input
                    type="number"
                    step="0.05"
                    value={form.faceMissingWeight}
                    onChange={(e) => set("faceMissingWeight", Number(e.target.value))}
                  />
                </Field>
              </div>
              <div className="rounded-lg bg-[var(--color-surface-2)] p-4 text-sm">
                <p className="font-medium">Review</p>
                <p className="mt-1 text-[var(--color-muted)]">
                  {form.title || "Untitled"} · {form.mode} · {form.durationMin}{" "}
                  min · seat cap {form.seatCap}
                </p>
              </div>
            </>
          )}

          <div className="mt-6 flex justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
                Next
              </Button>
            ) : (
              <Button onClick={submit} loading={create.isPending}>
                Create exam
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
