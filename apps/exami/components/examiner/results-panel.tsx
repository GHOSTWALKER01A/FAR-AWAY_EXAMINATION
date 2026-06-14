"use client";

import { useScoreboard, usePublishResults } from "@/lib/hooks/queries";
import { Button } from "@/components/ui/button";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { EmptyState, LoadingBlock } from "@/components/ui/misc";
import { ScoreDistribution } from "@/components/charts/score-distribution";
import { Trophy } from "lucide-react";
import type { ExamStatus } from "@/lib/types";

export function ResultsPanel({
  examId,
  status,
}: {
  examId: string;
  status: ExamStatus;
}) {
  const { data, isLoading } = useScoreboard(examId);
  const publish = usePublishResults(examId);
  const published = status === "RESULTS_PUBLISHED";

  const rows = data?.rows ?? [];
  const scores = rows
    .map((r) => (r.maxMarks ? (r.totalMarks / r.maxMarks) * 100 : 0))
    .filter((s) => isFinite(s));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted">
          {published
            ? "Results are public. Scoreboard re-ranks automatically on upheld grievances."
            : "Publish to compute ranks & percentiles for all candidates."}
        </p>
        {!published && (
          <Button onClick={() => publish.mutate()} loading={publish.isPending}>
            <Trophy className="h-4 w-4" /> Publish results
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingBlock />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No results yet"
          message="Once candidates submit and grading completes, the scoreboard appears here."
        />
      ) : (
        <div className="space-y-6">
          <ScoreDistribution scores={scores} total={rows.length} />
          <Table>
            <THead>
              <tr>
                <TH>Rank</TH>
                <TH>Candidate</TH>
                <TH>Score</TH>
                <TH>%</TH>
                <TH>Percentile</TH>
              </tr>
            </THead>
            <tbody>
              {rows.map((r) => (
                <TR key={r.session.id}>
                  <TD className="font-semibold">#{r.rank}</TD>
                  <TD>{r.session.user.name}</TD>
                  <TD className="tabular-nums">
                    {r.totalMarks}/{r.maxMarks}
                  </TD>
                  <TD className="tabular-nums">
                    {r.maxMarks ? ((r.totalMarks / r.maxMarks) * 100).toFixed(1) : "—"}%
                  </TD>
                  <TD className="tabular-nums text-muted">
                    {r.percentile.toFixed(1)}th
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
}
