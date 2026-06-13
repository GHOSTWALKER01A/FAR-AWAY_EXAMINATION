"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useExam, usePublishExam, useCloseExam } from "@/lib/hooks/queries";
import { PageHeader, LoadingBlock } from "@/components/ui/misc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { Modal } from "@/components/ui/modal";
import { RosterPanel } from "@/components/examiner/roster-panel";
import { GradingPanel } from "@/components/examiner/grading-panel";
import { ResultsPanel } from "@/components/examiner/results-panel";
import { fmtDate } from "@/lib/utils";
import { Rocket, Square, Pencil, BookOpen } from "lucide-react";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "questions", label: "Questions" },
  { key: "students", label: "Students" },
  { key: "grading", label: "Grading" },
  { key: "results", label: "Results" },
];

export default function ExamDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data: exam, isLoading } = useExam(id);
  const publish = usePublishExam(id);
  const close = useCloseExam(id);
  const [tab, setTab] = useState("overview");
  const [confirmPublish, setConfirmPublish] = useState(false);

  if (isLoading || !exam) return <LoadingBlock />;

  const isDraft = exam.status === "DRAFT";
  const isLive = exam.status === "LIVE" || exam.status === "SCHEDULED";

  return (
    <div>
      <PageHeader
        title={exam.title}
        subtitle={exam.description}
        actions={
          <div className="flex gap-2">
            {isDraft && (
              <Button onClick={() => setConfirmPublish(true)}>
                <Rocket className="h-4 w-4" /> Publish
              </Button>
            )}
            {isLive && (
              <Button
                variant="danger"
                onClick={() => close.mutate()}
                loading={close.isPending}
              >
                <Square className="h-4 w-4" /> Close
              </Button>
            )}
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <StatusBadge status={exam.status} />
        <Badge tone="brand">{exam.mode}</Badge>
        <Badge tone="neutral">{Math.round(exam.durationSeconds / 60)} min</Badge>
        {exam.seatCap && <Badge tone="neutral">{exam.seatCap} seats</Badge>}
      </div>

      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === "overview" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="space-y-2 pt-5 text-sm">
              <Row label="Mode" value={exam.mode} />
              <Row label="Registration" value={exam.registrationType} />
              <Row label="Opens" value={fmtDate(exam.startAt)} />
              <Row label="Closes" value={fmtDate(exam.endAt)} />
              <Row label="Duration" value={`${Math.round(exam.durationSeconds / 60)} min`} />
              <Row label="Seat cap" value={String(exam.seatCap ?? "—")} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="mb-2 text-sm font-medium">Quick actions</p>
              <div className="flex flex-col gap-2">
                {isDraft && (
                  <Link href={`/examiner/exams/${id}/edit`}>
                    <Button variant="outline" className="w-full justify-start">
                      <Pencil className="h-4 w-4" /> Edit configuration
                    </Button>
                  </Link>
                )}
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setTab("questions")}
                >
                  <BookOpen className="h-4 w-4" /> Manage questions
                </Button>
                {isLive && (
                  <Link href={`/monitor/${id}`}>
                    <Button variant="outline" className="w-full justify-start">
                      <Rocket className="h-4 w-4" /> Open live monitor
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "questions" && (
        <Card>
          <CardContent className="pt-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-[var(--color-muted)]">
                Build this exam from your question bank.
              </p>
              <Link href="/examiner/questions">
                <Button variant="outline">
                  <BookOpen className="h-4 w-4" /> Open question bank
                </Button>
              </Link>
            </div>
            <p className="text-sm text-[var(--color-muted)]">
              {exam.mode === "ADAPTIVE"
                ? "Adaptive exams draw from the calibrated bank automatically — ensure enough CALIBRATED items across difficulties."
                : exam.mode === "RANDOMISED"
                  ? "Randomised exams use a blueprint of topics × difficulty. Configure counts in the bank, then attach."
                  : "Fixed exams use an ordered question set. Select and order items from the bank."}
            </p>
          </CardContent>
        </Card>
      )}

      {tab === "students" && <RosterPanel examId={id} />}
      {tab === "grading" && <GradingPanel examId={id} />}
      {tab === "results" && <ResultsPanel examId={id} status={exam.status} />}

      <Modal
        open={confirmPublish}
        onClose={() => setConfirmPublish(false)}
        title="Publish this exam?"
        description={
          exam.publishAt
            ? `It will auto-go-live at ${fmtDate(exam.publishAt)}. You cannot edit it after publishing.`
            : "It will go LIVE immediately. You cannot edit it after publishing."
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmPublish(false)}>
              Cancel
            </Button>
            <Button
              loading={publish.isPending}
              onClick={async () => {
                await publish.mutateAsync(exam.publishAt);
                setConfirmPublish(false);
              }}
            >
              Confirm publish
            </Button>
          </>
        }
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-[var(--color-border)] py-1.5 last:border-0">
      <span className="text-[var(--color-muted)]">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
