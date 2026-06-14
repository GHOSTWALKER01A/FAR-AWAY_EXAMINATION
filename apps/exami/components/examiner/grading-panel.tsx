"use client";

import { useState } from "react";
import { useReviewQueue, useApproveEval, useOverrideEval } from "@/lib/hooks/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState, LoadingBlock } from "@/components/ui/misc";
import { cn } from "@/lib/utils";
import type { EvaluationItem } from "@/lib/types";

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const tone = value < 0.5 ? "danger" : value < 0.75 ? "warning" : "success";
  const color =
    tone === "danger" ? "var(--color-danger)" : tone === "warning" ? "var(--color-warning)" : "var(--color-success)";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs text-[var(--color-muted)]">{pct}% conf</span>
    </div>
  );
}

function GradeRow({ item, examId }: { item: EvaluationItem; examId: string }) {
  const approve = useApproveEval(examId);
  const override = useOverrideEval(examId);
  const [editing, setEditing] = useState(false);
  const [criteria, setCriteria] = useState(item.criteria);

  const total = criteria.reduce((s, c) => s + (Number(c.awarded) || 0), 0);

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-medium uppercase text-[var(--color-muted)]">
              Question · {item.response.question.marks} marks
            </p>
            <p className="mb-3 text-sm font-medium">{item.response.question.stem}</p>
            <p className="mb-1 text-xs font-medium uppercase text-[var(--color-muted)]">
              Candidate answer
            </p>
            <p className="whitespace-pre-wrap rounded-lg bg-[var(--color-surface-2)] p-3 text-sm">
              {(item.response.answer as any).text || <span className="italic text-[var(--color-muted)]">No response provided</span>}
            </p>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <ConfidenceBar value={item.confidence} />
              <Badge tone="brand">AI suggests {item.awarded}</Badge>
            </div>
            <div className="space-y-2">
              {criteria.map((c, i) => (
                <div key={i} className="rounded-lg border border-[var(--color-border)] p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm">{c.criterion}</span>
                    {editing ? (
                      <Input
                        type="number"
                        className="h-8 w-20"
                        value={c.awarded}
                        max={c.max}
                        onChange={(e) => {
                          const next = [...criteria];
                          next[i] = { ...c, awarded: Number(e.target.value) };
                          setCriteria(next);
                        }}
                      />
                    ) : (
                      <span className="text-sm font-medium">
                        {c.awarded}/{c.max}
                      </span>
                    )}
                  </div>
                  {c.justification && (
                    <p className="mt-1 text-xs text-[var(--color-muted)]">{c.justification}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm font-semibold">Total: {total}</span>
              <div className="flex gap-2">
                {editing ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      loading={override.isPending}
                      onClick={() =>
                        override.mutate({ id: item.id, awarded: total, criteria })
                      }
                    >
                      Save override
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                      Override
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      loading={approve.isPending}
                      onClick={() => approve.mutate(item.id)}
                    >
                      Approve
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function GradingPanel({ examId }: { examId: string }) {
  const { data, isLoading } = useReviewQueue(examId);

  if (isLoading) return <LoadingBlock />;
  if (!data || data.length === 0)
    return (
      <EmptyState
        title="Nothing to review"
        message="All subjective answers are graded, or grading hasn't started. Lowest-confidence items surface here first."
      />
    );

  return (
    <div className="space-y-4">
      <p className={cn("text-sm text-[var(--color-muted)]")}>
        {data.length} answers awaiting review — sorted by lowest AI confidence.
      </p>
      {data.map((it) => (
        <GradeRow key={it.id} item={it} examId={examId} />
      ))}
    </div>
  );
}
