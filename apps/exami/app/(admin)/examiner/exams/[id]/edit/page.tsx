"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useExam, useUpdateExam } from "@/lib/hooks/queries";
import { PageHeader, LoadingBlock } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertTriangle, ArrowLeft, Save } from "lucide-react";
import type { ExamMode } from "@/lib/types";

const MODE_INFO: Record<ExamMode, string> = {
  ADAPTIVE: "IRT-driven. Each question chosen from the candidate's ability level.",
  FIXED: "Every candidate sees the same questions in the same order.",
  RANDOMISED: "Questions drawn from the bank per a blueprint of topics & difficulty.",
};

function isoToLocal(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function EditExam() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: exam, isLoading, isError } = useExam(id);
  const update = useUpdateExam(id);

  const [ready, setReady] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    mode: "ADAPTIVE" as ExamMode,
    registrationType: "PRE_REGISTERED",
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

  useEffect(() => {
    if (!exam) return;
    const mc = (exam.markingConfig ?? {}) as Record<string, number>;
    const ac = (exam.adaptiveConfig ?? {}) as Record<string, number>;
    const pc = (exam.proctoringConfig ?? {}) as {
      requireCamera?: boolean;
      weights?: Record<string, number>;
    };
    setForm({
      title: exam.title ?? "",
      description: exam.description ?? "",
      mode: exam.mode,
      registrationType: exam.registrationType ?? "PRE_REGISTERED",
      durationMin: Math.round((exam.durationSeconds ?? 3600) / 60),
      startAt: isoToLocal(exam.startAt),
      endAt: isoToLocal(exam.endAt),
      publishAt: isoToLocal(exam.publishAt),
      seatCap: exam.seatCap ?? 100,
      negativePenalty: mc.negativePenalty ?? 0,
      seTarget: ac.seTarget ?? 0.3,
      minItems: ac.minItems ?? 10,
      maxItems: ac.maxItems ?? 40,
      requireCamera: pc.requireCamera ?? true,
      tabSwitchWeight: pc.weights?.TAB_SWITCH ?? 0.15,
      faceMissingWeight: pc.weights?.FACE_MISSING ?? 0.25,
    });
    setReady(true);
  }, [exam]);

  if (isLoading || !ready) return <LoadingBlock />;

  if (isError || !exam) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <AlertTriangle className="h-8 w-8 text-danger" />
        <p className="font-medium">Could not load exam</p>
        <Button variant="outline" onClick={() => router.push("/examiner/exams")}>
          <ArrowLeft className="h-4 w-4" /> Back to exams
        </Button>
      </div>
    );
  }

  if (exam.status !== "DRAFT") {
    return (
      <div className="mx-auto max-w-lg py-24 text-center">
        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-warning" />
        <p className="mb-1 font-semibold">Exam is {exam.status}</p>
        <p className="mb-6 text-sm text-muted">
          Only DRAFT exams can be edited. Published and live exams are locked to
          preserve result integrity.
        </p>
        <Button variant="outline" onClick={() => router.push(`/examiner/exams/${id}`)}>
          <ArrowLeft className="h-4 w-4" /> Back to exam
        </Button>
      </div>
    );
  }

  const errors: string[] = [];
  if (form.title.trim().length < 3) errors.push("Title must be at least 3 characters.");
  if (form.durationMin < 1) errors.push("Duration must be at least 1 minute.");
  if (form.seatCap < 1) errors.push("Seat cap must be at least 1.");
  if (form.mode === "ADAPTIVE" && form.minItems >= form.maxItems)
    errors.push("Min items must be less than max items.");
  if (
    form.startAt &&
    form.endAt &&
    new Date(form.startAt) >= new Date(form.endAt)
  )
    errors.push("Closes at must be after Opens at.");

  const submit = async () => {
    if (errors.length) return;
    await update.mutateAsync({
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      mode: form.mode,
      registrationType: form.registrationType as "PRE_REGISTERED" | "OPEN",
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
    router.push(`/examiner/exams/${id}`);
  };

  return (
    <div className="mx-auto max-w-2xl pb-12">
      <PageHeader
        title="Edit exam"
        subtitle={`Editing draft: ${exam.title}`}
        actions={
          <Button
            variant="ghost"
            onClick={() => router.push(`/examiner/exams/${id}`)}
          >
            <ArrowLeft className="h-4 w-4" /> Cancel
          </Button>
        }
      />

      {/* ── Basics ─────────────────────────────────────────────── */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Basics</CardTitle>
        </CardHeader>
        <CardContent>
          <Field label="Title">
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. JEE Mock Test 1"
            />
          </Field>
          <Field label="Description (optional)">
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Full syllabus mock…"
              rows={3}
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
                    "rounded-lg border p-3 text-left text-sm transition-colors",
                    form.mode === m
                      ? "border-brand bg-brand-soft"
                      : "border-border hover:bg-surface-2",
                  )}
                >
                  <p className="font-semibold">{m}</p>
                  <p className="mt-0.5 text-xs text-muted">{MODE_INFO[m]}</p>
                </button>
              ))}
            </div>
          </Field>
          <Field label="Registration type">
            <Select
              value={form.registrationType}
              onChange={(e) => set("registrationType", e.target.value)}
            >
              <option value="PRE_REGISTERED">Pre-registered (roster)</option>
              <option value="OPEN">Open / self-register</option>
            </Select>
          </Field>
        </CardContent>
      </Card>

      {/* ── Timing ─────────────────────────────────────────────── */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Timing</CardTitle>
        </CardHeader>
        <CardContent>
          <Field label="Duration (minutes)">
            <Input
              type="number"
              min={1}
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
            label="Scheduled publish"
            hint="Exam goes LIVE automatically at this time. Leave blank to publish manually."
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
              min={1}
              value={form.seatCap}
              onChange={(e) => set("seatCap", Number(e.target.value))}
            />
          </Field>
        </CardContent>
      </Card>

      {/* ── Marking ────────────────────────────────────────────── */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Marking</CardTitle>
        </CardHeader>
        <CardContent>
          <Field
            label="Negative marking penalty"
            hint="Fraction of marks deducted per wrong answer. E.g. 0.25 deducts 25% of the question's marks. Set 0 to disable."
          >
            <Input
              type="number"
              min={0}
              step="0.05"
              value={form.negativePenalty}
              onChange={(e) => set("negativePenalty", Number(e.target.value))}
            />
          </Field>
        </CardContent>
      </Card>

      {/* ── Adaptive engine ────────────────────────────────────── */}
      {form.mode === "ADAPTIVE" && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Adaptive engine</CardTitle>
          </CardHeader>
          <CardContent>
            <Field
              label="Target standard error (seTarget)"
              hint="Lower value = more measurement precision but more questions served."
            >
              <Input
                type="number"
                min={0.05}
                max={1}
                step="0.05"
                value={form.seTarget}
                onChange={(e) => set("seTarget", Number(e.target.value))}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Min items">
                <Input
                  type="number"
                  min={1}
                  value={form.minItems}
                  onChange={(e) => set("minItems", Number(e.target.value))}
                />
              </Field>
              <Field label="Max items">
                <Input
                  type="number"
                  min={1}
                  value={form.maxItems}
                  onChange={(e) => set("maxItems", Number(e.target.value))}
                />
              </Field>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Proctoring ─────────────────────────────────────────── */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Proctoring</CardTitle>
        </CardHeader>
        <CardContent>
          <Field label="Camera requirement">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.requireCamera}
                onChange={(e) => set("requireCamera", e.target.checked)}
                className="h-4 w-4"
              />
              Candidates must grant camera access before starting the exam
            </label>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Tab-switch weight"
              hint="Proctoring score penalty per tab switch (0–1)."
            >
              <Input
                type="number"
                min={0}
                max={1}
                step="0.05"
                value={form.tabSwitchWeight}
                onChange={(e) => set("tabSwitchWeight", Number(e.target.value))}
              />
            </Field>
            <Field
              label="Face-missing weight"
              hint="Proctoring score penalty per face-missing event (0–1)."
            >
              <Input
                type="number"
                min={0}
                max={1}
                step="0.05"
                value={form.faceMissingWeight}
                onChange={(e) => set("faceMissingWeight", Number(e.target.value))}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* ── Validation errors ──────────────────────────────────── */}
      {errors.length > 0 && (
        <div className="mb-4 rounded-lg border border-danger bg-(--color-danger-soft,#fff1f2) p-4">
          <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-danger">
            <AlertTriangle className="h-4 w-4" /> Fix the following before saving
          </p>
          <ul className="list-inside list-disc space-y-0.5 text-sm text-danger">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Actions ────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3">
        <Button
          variant="ghost"
          onClick={() => router.push(`/examiner/exams/${id}`)}
          disabled={update.isPending}
        >
          Cancel
        </Button>
        <Button
          onClick={submit}
          disabled={errors.length > 0 || update.isPending}
          loading={update.isPending}
        >
          <Save className="h-4 w-4" /> Save changes
        </Button>
      </div>
    </div>
  );
}
