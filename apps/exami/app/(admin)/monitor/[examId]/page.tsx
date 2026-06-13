"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useProctorFeed } from "@/lib/hooks/use-proctor-feed";
import { proctorApi } from "@/lib/api/proctor";
import { useExam } from "@/lib/hooks/queries";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RiskBadge } from "@/components/proctor/risk-badge";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Textarea } from "@/components/ui/input";
import { toast } from "@/lib/store/toast";
import { fmtDate, cn } from "@/lib/utils";
import { Flag, Clock, Wifi, WifiOff, Send } from "lucide-react";
import type { LiveSession } from "@/lib/types";

export default function LiveWall() {
  const { examId } = useParams<{ examId: string }>();
  const { data: exam } = useExam(examId);
  const { list, conn, sendMessage } = useProctorFeed(examId);
  const [active, setActive] = useState<LiveSession | null>(null);

  return (
    <div>
      <PageHeader
        title={exam?.title ? `Monitoring · ${exam.title}` : "Live monitor"}
        subtitle="Candidates are sorted by risk. Highest risk floats to the top."
        actions={
          <Badge tone={conn === "live" ? "success" : "warning"}>
            {conn === "live" ? (
              <Wifi className="h-3.5 w-3.5" />
            ) : (
              <WifiOff className="h-3.5 w-3.5" />
            )}
            {conn === "live" ? "Real-time" : conn === "polling" ? "Polling" : "Connecting"}
          </Badge>
        }
      />

      {list.length === 0 ? (
        <EmptyState
          title="No active candidates"
          message="Candidate sessions and their risk scores appear here in real time."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((s) => (
            <CandidateCard key={s.sessionId} s={s} onClick={() => setActive(s)} />
          ))}
        </div>
      )}

      <CandidateDrawer
        session={active}
        onClose={() => setActive(null)}
        onMessage={sendMessage}
      />
    </div>
  );
}

function CandidateCard({
  s,
  onClick,
}: {
  s: LiveSession;
  onClick: () => void;
}) {
  const border =
    s.bucket === "HIGH"
      ? "border-l-[var(--color-danger)]"
      : s.bucket === "MEDIUM"
        ? "border-l-[var(--color-warning)]"
        : "border-l-[var(--color-success)]";
  return (
    <Card
      className={cn("cursor-pointer border-l-4 p-4 transition-shadow hover:shadow-md", border)}
      onClick={onClick}
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="truncate font-medium">{s.userName ?? "Candidate"}</p>
        <RiskBadge bucket={s.bucket} score={s.score} />
      </div>
      {s.flagged && (
        <Badge tone="danger" className="mb-2">
          <Flag className="h-3 w-3" /> Flagged
        </Badge>
      )}
      <div className="space-y-1">
        {(s.latest ?? []).slice(0, 3).map((ev, i) => (
          <div
            key={i}
            className="flex items-center justify-between text-xs text-[var(--color-muted)]"
          >
            <span>{ev.type}</span>
            <span>{new Date(ev.occurredAt).toLocaleTimeString()}</span>
          </div>
        ))}
        {(!s.latest || s.latest.length === 0) && (
          <p className="text-xs text-[var(--color-muted-2)]">No events</p>
        )}
      </div>
    </Card>
  );
}

function CandidateDrawer({
  session,
  onClose,
  onMessage,
}: {
  session: LiveSession | null;
  onClose: () => void;
  onMessage: (sessionId: string, msg: string) => void;
}) {
  const [note, setNote] = useState("");
  const [extra, setExtra] = useState("5");
  const [msg, setMsg] = useState("");

  const flag = useMutation({
    mutationFn: () => proctorApi.flag(session!.sessionId, note),
    onSuccess: () => {
      toast.success("Session flagged");
      setNote("");
    },
    onError: (e: Error) => toast.error("Flag failed", e.message),
  });

  const extend = useMutation({
    mutationFn: () => proctorApi.extendTime(session!.sessionId, Number(extra) * 60),
    onSuccess: () => toast.success(`Added ${extra} minutes`),
    onError: (e: Error) => toast.error("Extend failed", e.message),
  });

  if (!session) return null;

  return (
    <Modal
      open={!!session}
      onClose={onClose}
      title={session.userName ?? "Candidate"}
      description={`Risk ${session.bucket} · ${(session.score * 100).toFixed(0)}%`}
    >
      <div className="mb-4">
        <p className="mb-2 text-sm font-medium">Event timeline</p>
        <div className="max-h-48 space-y-1.5 overflow-y-auto">
          {(session.latest ?? []).map((ev, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg bg-[var(--color-surface-2)] px-3 py-2 text-sm"
            >
              <span>{ev.type}</span>
              <span className="text-xs text-[var(--color-muted)]">
                sev {ev.severity.toFixed(1)} · conf {ev.confidence.toFixed(1)} ·{" "}
                {fmtDate(ev.occurredAt)}
              </span>
            </div>
          ))}
          {(!session.latest || session.latest.length === 0) && (
            <p className="text-sm text-[var(--color-muted)]">No events recorded.</p>
          )}
        </div>
      </div>

      <Field label="Send a message to the candidate">
        <div className="flex gap-2">
          <Input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="e.g. Please face the camera" />
          <Button
            variant="outline"
            onClick={() => {
              if (msg.trim()) {
                onMessage(session.sessionId, msg);
                toast.info("Message sent");
                setMsg("");
              }
            }}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Field>

      <Field label="Flag with a note">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reason for flagging…"
        />
      </Field>
      <Button
        variant="danger"
        className="mb-4 w-full"
        loading={flag.isPending}
        disabled={!note.trim()}
        onClick={() => flag.mutate()}
      >
        <Flag className="h-4 w-4" /> Flag session
      </Button>

      <Field label="Extend time (minutes)">
        <div className="flex gap-2">
          <Input
            type="number"
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
          />
          <Button
            variant="outline"
            loading={extend.isPending}
            onClick={() => extend.mutate()}
          >
            <Clock className="h-4 w-4" /> Extend
          </Button>
        </div>
      </Field>
    </Modal>
  );
}
