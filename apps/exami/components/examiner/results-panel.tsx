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

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-[var(--color-muted)]">
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
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="No results yet"
          message="Once candidates submit and grading completes, the scoreboard appears here."
        />
      ) : (
        <div className="space-y-6">
          <ScoreDistribution
            scores={data.map((r) => (r.totalMarks / r.maxMarks) * 100)}
          />
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
              {data.map((r) => (
                <TR key={r.rank}>
                  <TD className="font-semibold">#{r.rank}</TD>
                  <TD>{r.session.user.name}</TD>
                  <TD>
                    {r.totalMarks}/{r.maxMarks}
                  </TD>
                  <TD>{((r.totalMarks / r.maxMarks) * 100).toFixed(1)}%</TD>
                  <TD className="text-[var(--color-muted)]">
                    {r.percentile.toFixed(1)}
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
