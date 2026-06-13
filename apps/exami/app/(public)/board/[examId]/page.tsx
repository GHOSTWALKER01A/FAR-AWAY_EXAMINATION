"use client";

import { useParams } from "next/navigation";
import { useScoreboard } from "@/lib/hooks/queries";
import { PageHeader, EmptyState, LoadingBlock } from "@/components/ui/misc";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { ScoreDistribution } from "@/components/charts/score-distribution";
import { cn } from "@/lib/utils";

export default function PublicBoard() {
  const { examId } = useParams<{ examId: string }>();
  const { data, isLoading } = useScoreboard(examId);

  return (
    <div>
      <PageHeader title="Scoreboard" subtitle="Final ranks and percentiles." />
      {isLoading ? (
        <LoadingBlock />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No results published" message="Check back once results are out." />
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
                <TH>Percentile</TH>
              </tr>
            </THead>
            <tbody>
              {data.map((r) => (
                <TR
                  key={r.rank}
                  className={cn(r.rank <= 3 && "bg-[var(--color-brand-soft)]/40")}
                >
                  <TD className="font-semibold">
                    {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : `#${r.rank}`}
                  </TD>
                  <TD>{r.session.user.name}</TD>
                  <TD>
                    {r.totalMarks}/{r.maxMarks}
                  </TD>
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
