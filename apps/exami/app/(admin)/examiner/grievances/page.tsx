"use client";

import { useState } from "react";
import { useGrievances, useResolveGrievance } from "@/lib/hooks/queries";
import { PageHeader, EmptyState, LoadingBlock } from "@/components/ui/misc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import type { Grievance } from "@/lib/types";

const TABS: { key: "OPEN" | "UPHELD" | "REJECTED"; label: string }[] = [
  { key: "OPEN", label: "Open" },
  { key: "UPHELD", label: "Upheld" },
  { key: "REJECTED", label: "Rejected" },
];

export default function Grievances() {
  const [status, setStatus] = useState<"OPEN" | "UPHELD" | "REJECTED">("OPEN");
  const { data, isLoading } = useGrievances(status);
  const resolve = useResolveGrievance();
  const [active, setActive] = useState<Grievance | null>(null);
  const [note, setNote] = useState("");
  const [adjusted, setAdjusted] = useState<string>("");

  const doResolve = async (upheld: boolean) => {
    if (!active) return;
    await resolve.mutateAsync({
      id: active.id,
      upheld,
      note: note || undefined,
      adjustedMarks: adjusted ? Number(adjusted) : undefined,
    });
    setActive(null);
    setNote("");
    setAdjusted("");
  };

  return (
    <div>
      <PageHeader
        title="Grievances"
        subtitle="Review candidate disputes. Upholding re-ranks the scoreboard."
      />

      <div className="mb-5 flex gap-1 border-b border-[var(--color-border)]">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setStatus(t.key)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium",
              status === t.key
                ? "border-[var(--color-brand)] text-[var(--color-brand)]"
                : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-fg)]",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingBlock />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No grievances" message={`No ${status.toLowerCase()} disputes.`} />
      ) : (
        <div className="space-y-3">
          {data.map((g) => (
            <Card key={g.id}>
              <CardContent className="flex items-start justify-between gap-4 pt-5">
                <div className="flex-1">
                  <div className="mb-1.5 flex items-center gap-2">
                    <Badge
                      tone={
                        g.status === "OPEN"
                          ? "warning"
                          : g.status === "UPHELD"
                            ? "success"
                            : "danger"
                      }
                    >
                      {g.status}
                    </Badge>
                    {(g as any).user && (
                      <span className="text-sm font-medium">{(g as any).user.name}</span>
                    )}
                  </div>
                  {(g as any).question && (
                    <p className="mb-1 text-sm font-medium">{(g as any).question.stem}</p>
                  )}
                  <p className="text-sm text-[var(--color-muted)]">{g.reason}</p>
                </div>
                {g.status === "OPEN" && (
                  <Button variant="outline" size="sm" onClick={() => setActive(g)}>
                    Resolve
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={!!active}
        onClose={() => setActive(null)}
        title="Resolve grievance"
        description={active?.reason}
      >
        <Field label="Resolution note">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Explain the decision…"
          />
        </Field>
        <Field
          label="Adjusted marks (optional)"
          hint="Only when upholding and changing the score."
        >
          <Input
            type="number"
            value={adjusted}
            onChange={(e) => setAdjusted(e.target.value)}
          />
        </Field>
        <div className="flex justify-end gap-2 pb-2">
          <Button
            variant="danger"
            loading={resolve.isPending}
            onClick={() => doResolve(false)}
          >
            Reject
          </Button>
          <Button
            variant="success"
            loading={resolve.isPending}
            onClick={() => doResolve(true)}
          >
            Uphold
          </Button>
        </div>
      </Modal>
    </div>
  );
}
