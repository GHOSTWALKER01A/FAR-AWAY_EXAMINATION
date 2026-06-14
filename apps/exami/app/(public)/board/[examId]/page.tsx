"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useScoreboard } from "@/lib/hooks/queries";
import { useAuth } from "@/lib/store/auth";
import { Skeleton } from "@/components/ui/misc";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScoreDistribution } from "@/components/charts/score-distribution";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Clock,
  Medal,
  Search,
  Timer,
  Trophy,
  Users,
} from "lucide-react";
import type { ScoreRow } from "@/lib/types";

function pct(awarded: number, max: number) {
  if (!max) return "—";
  return `${((awarded / max) * 100).toFixed(1)}%`;
}

function fmtDur(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

const MEDAL_EMOJI: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

/* ── loading skeleton ─────────────────────────────────────────────── */
function BoardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
      <div className="flex justify-center gap-6">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-28 rounded-2xl" />)}
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
      </div>
    </div>
  );
}

/* ── stat card ────────────────────────────────────────────────────── */
function StatCard({
  icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-xl border p-4",
      highlight ? "border-brand bg-brand-soft" : "border-border bg-surface-2",
    )}>
      <div className="mb-2 flex items-center gap-1.5">
        <span className={highlight ? "text-brand" : "text-muted"}>{icon}</span>
        <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
      </div>
      <p className={cn("text-2xl font-bold tabular-nums", highlight ? "text-brand" : "text-fg")}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}

/* ── podium card ──────────────────────────────────────────────────── */
function PodiumCard({ row, rank, isMe }: { row: ScoreRow; rank: number; isMe: boolean }) {
  const topPad: Record<number, string> = { 1: "pt-4", 2: "pt-8", 3: "pt-10" };
  return (
    <div className={cn(
      "flex flex-col items-center gap-2 rounded-2xl border px-5 pb-5 text-center transition-transform",
      topPad[rank] ?? "pt-8",
      rank === 1
        ? "border-brand bg-brand-soft shadow-lg sm:scale-105"
        : isMe
          ? "border-success bg-success-soft"
          : "border-border bg-surface-2",
    )}>
      <span className="text-4xl">{MEDAL_EMOJI[rank]}</span>
      <p className="max-w-[110px] truncate text-sm font-semibold">
        {row.session.user.name}
        {isMe && <span className="ml-1 text-[10px] text-brand">(You)</span>}
      </p>
      <p className="text-2xl font-bold tabular-nums">
        {row.totalMarks}
        <span className="text-base font-normal text-muted">/{row.maxMarks}</span>
      </p>
      <p className="text-xs text-muted">
        {pct(row.totalMarks, row.maxMarks)} · {row.percentile.toFixed(1)}%ile
      </p>
      <div className="mt-1 w-full rounded-full border border-border bg-surface px-2 py-0.5">
        <p className="text-xs font-bold">#{rank}</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
export default function PublicBoard() {
  const { examId } = useParams<{ examId: string }>();
  const { data, isLoading, isError } = useScoreboard(examId);
  const [search, setSearch] = useState("");
  const claims = useAuth((s) => s.claims);

  if (isLoading) return <div className="mx-auto max-w-5xl"><BoardSkeleton /></div>;

  if (isError) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-3 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger-soft">
          <AlertTriangle className="h-8 w-8 text-danger" />
        </div>
        <p className="text-lg font-semibold">Could not load scoreboard</p>
        <p className="text-sm text-muted">Check your connection and try again.</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (!data) return null;

  const { exam, rows } = data;

  if (!rows.length) {
    return (
      <div className="mx-auto max-w-lg">
        {exam && (
          <div className="mb-8 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={exam.status} />
              {exam.mode && <Badge tone="brand">{exam.mode}</Badge>}
            </div>
            <h1 className="text-2xl font-bold">{exam.title}</h1>
            {exam.durationSeconds && (
              <p className="text-sm text-muted">
                <Timer className="mr-1 inline-block h-3.5 w-3.5" />
                {fmtDur(exam.durationSeconds)}
              </p>
            )}
          </div>
        )}
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-surface py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-2">
            <Clock className="h-8 w-8 text-muted" />
          </div>
          <div>
            <p className="text-lg font-semibold">Results not yet published</p>
            <p className="mt-1 text-sm text-muted">
              Check back after the examiner publishes results.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ── stats ── */
  const scores = rows.filter((r) => r.maxMarks > 0).map((r) => (r.totalMarks / r.maxMarks) * 100);
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const highScore = scores.length > 0 ? Math.max(...scores) : 0;
  const passCount = scores.filter((s) => s >= 40).length;
  const myRow = claims ? rows.find((r) => r.session.userId === claims.sub) : null;
  const top3 = rows.slice(0, 3);
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const filtered = search.trim()
    ? rows.filter((r) => r.session.user.name.toLowerCase().includes(search.toLowerCase()))
    : rows;

  return (
    <div className="mx-auto max-w-5xl space-y-8">

      {/* Header */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={exam?.status ?? "RESULTS_PUBLISHED"} />
          {exam?.mode && <Badge tone="brand">{exam.mode}</Badge>}
          <Badge tone="success"><Trophy className="h-3 w-3" /> Results published</Badge>
        </div>
        <h1 className="text-3xl font-bold">{exam?.title ?? "Scoreboard"}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
          {exam?.durationSeconds && (
            <span className="flex items-center gap-1">
              <Timer className="h-3.5 w-3.5" />{fmtDur(exam.durationSeconds)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {rows.length} candidate{rows.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<Users className="h-4 w-4" />} label="Total" value={String(rows.length)} sub="candidates sat" />
        <StatCard icon={<Trophy className="h-4 w-4" />} label="Average" value={`${avgScore.toFixed(1)}%`} sub="mean score" highlight />
        <StatCard icon={<Trophy className="h-4 w-4" />} label="Highest" value={`${highScore.toFixed(1)}%`} sub={rows[0]?.session?.user?.name} />
        <StatCard
          icon={<Medal className="h-4 w-4" />}
          label="Pass rate"
          value={`${scores.length > 0 ? Math.round((passCount / scores.length) * 100) : 0}%`}
          sub={`${passCount} of ${rows.length} passed`}
        />
      </div>

      {/* My position */}
      {myRow && (
        <div className="flex items-center gap-4 rounded-2xl border border-brand bg-brand-soft p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-2xl font-bold text-white">
            {MEDAL_EMOJI[myRow.rank] ?? `#${myRow.rank}`}
          </div>
          <div>
            <p className="font-semibold text-brand">Your result</p>
            <p className="mt-0.5 text-sm text-brand">
              Rank #{myRow.rank} · {myRow.totalMarks}/{myRow.maxMarks} marks ·{" "}
              {pct(myRow.totalMarks, myRow.maxMarks)} · {myRow.percentile.toFixed(1)}th percentile
            </p>
          </div>
        </div>
      )}

      {/* Podium */}
      {top3.length > 0 && (
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">Top performers</h2>
          <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-end sm:justify-center">
            {podiumOrder.map((r) => {
              const rank = rows.indexOf(r) + 1;
              const isMe = !!claims && r.session.userId === claims.sub;
              return <PodiumCard key={r.session.id} row={r} rank={rank} isMe={isMe} />;
            })}
          </div>
        </div>
      )}

      {/* Distribution */}
      {scores.length > 1 && <ScoreDistribution scores={scores} total={rows.length} />}

      {/* Full table */}
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-semibold">
            Full rankings{" "}
            <span className="text-sm font-normal text-muted">({rows.length} candidates)</span>
          </h2>
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              placeholder="Search by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {search && (
          <p className="mb-3 text-sm text-muted">
            Showing {filtered.length} of {rows.length} candidates
          </p>
        )}

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-12 text-center">
            <Search className="h-8 w-8 text-muted" />
            <p className="font-medium">No matches for &ldquo;{search}&rdquo;</p>
            <button onClick={() => setSearch("")} className="text-sm text-brand hover:underline">
              Clear search
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            {/* Header */}
            <div className="grid grid-cols-[3rem_1fr_6rem_6rem_6rem] border-b border-border bg-surface-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
              <span>Rank</span>
              <span>Candidate</span>
              <span className="text-right">Score</span>
              <span className="text-right">%</span>
              <span className="text-right">Percentile</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border">
              {filtered.map((r) => {
                const isMe = !!claims && r.session.userId === claims.sub;
                const isPassing = r.maxMarks > 0 && r.totalMarks / r.maxMarks >= 0.4;
                return (
                  <div
                    key={r.session.id}
                    className={cn(
                      "grid grid-cols-[3rem_1fr_6rem_6rem_6rem] items-center px-4 py-3 transition-colors",
                      isMe ? "bg-brand-soft" : "hover:bg-surface-2",
                    )}
                  >
                    <span className="text-sm font-bold tabular-nums">
                      {MEDAL_EMOJI[r.rank] ?? `#${r.rank}`}
                    </span>

                    <div className="flex min-w-0 items-center gap-2">
                      <div className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        isMe ? "bg-brand text-white" : "bg-surface-2 text-muted",
                      )}>
                        {r.session.user.name.charAt(0).toUpperCase()}
                      </div>
                      <p className={cn("truncate text-sm font-medium", isMe && "text-brand")}>
                        {r.session.user.name}
                        {isMe && (
                          <span className="ml-1.5 rounded-full bg-brand px-1.5 py-0.5 text-[10px] text-white">You</span>
                        )}
                      </p>
                    </div>

                    <span className="text-right text-sm tabular-nums">{r.totalMarks}/{r.maxMarks}</span>
                    <span className={cn("text-right text-sm font-medium tabular-nums", isPassing ? "text-success" : "text-danger")}>
                      {pct(r.totalMarks, r.maxMarks)}
                    </span>
                    <span className="text-right text-sm tabular-nums text-muted">
                      {r.percentile.toFixed(1)}th
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
