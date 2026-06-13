"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useReport } from "@/lib/hooks/queries";
import { StudentTopbar } from "@/components/shared/student-topbar";
import { PageHeader, LoadingBlock, EmptyState } from "@/components/ui/misc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/shared/stat-card";
import { CheckCircle2, XCircle, Trophy, Percent, MessageSquareWarning } from "lucide-react";

export default function MyResult() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data: report, isLoading } = useReport(sessionId);

  return (
    <div>
      <StudentTopbar />
      <div className="mx-auto max-w-3xl px-6 py-8">
        <PageHeader title="Your result" />
        {isLoading ? (
          <LoadingBlock />
        ) : !report ? (
          <EmptyState title="Result not available" message="Grading may still be in progress." />
        ) : (
          <>
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                label="Score"
                value={`${report.totalMarks}/${report.maxMarks}`}
                icon={<Trophy className="h-5 w-5" />}
              />
              {report.rank != null && (
                <StatCard
                  label="Rank"
                  value={`#${report.rank}`}
                  icon={<Trophy className="h-5 w-5" />}
                  tone="info"
                />
              )}
              {report.percentile != null && (
                <StatCard
                  label="Percentile"
                  value={report.percentile.toFixed(1)}
                  icon={<Percent className="h-5 w-5" />}
                  tone="success"
                />
              )}
            </div>

            <div className="space-y-3">
              {report.items.map((it) => (
                <Card key={it.questionId}>
                  <CardContent className="pt-5">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <p className="font-medium">{it.stem}</p>
                      <Badge
                        tone={
                          it.awarded >= it.marks
                            ? "success"
                            : it.awarded > 0
                              ? "warning"
                              : "danger"
                        }
                      >
                        {it.awarded}/{it.marks}
                      </Badge>
                    </div>
                    {typeof it.correct === "boolean" && (
                      <p className="mb-2 flex items-center gap-1 text-sm">
                        {it.correct ? (
                          <CheckCircle2 className="h-4 w-4 text-[var(--color-success)]" />
                        ) : (
                          <XCircle className="h-4 w-4 text-[var(--color-danger)]" />
                        )}
                        {it.correct ? "Correct" : "Incorrect"}
                      </p>
                    )}
                    {it.rubricBreakdown && (
                      <div className="mt-2 space-y-1">
                        {it.rubricBreakdown.map((c, i) => (
                          <div
                            key={i}
                            className="flex justify-between rounded bg-[var(--color-surface-2)] px-2 py-1 text-xs"
                          >
                            <span>{c.criterion}</span>
                            <span className="font-medium">
                              {c.awarded}/{c.max}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {it.justification && (
                      <p className="mt-2 text-xs text-[var(--color-muted)]">
                        {it.justification}
                      </p>
                    )}
                    <div className="mt-3">
                      <Link
                        href={`/results/${sessionId}/dispute?questionId=${it.questionId}`}
                      >
                        <Button variant="ghost" size="sm">
                          <MessageSquareWarning className="h-4 w-4" /> Raise dispute
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
