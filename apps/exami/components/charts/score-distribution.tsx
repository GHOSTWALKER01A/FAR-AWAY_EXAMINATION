"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Bucket percentage scores into deciles for a distribution histogram. */
export function ScoreDistribution({
  scores,
  total,
}: {
  scores: number[];
  total?: number;
}) {
  if (!scores.length) return null;

  const buckets = Array.from({ length: 10 }, (_, i) => ({
    range: `${i * 10}–${i * 10 + 10}`,
    count: 0,
  }));
  let sum = 0;
  let highest = 0;
  let lowest = 100;
  for (const s of scores) {
    const idx = Math.min(9, Math.max(0, Math.floor(s / 10)));
    buckets[idx].count += 1;
    sum += s;
    if (s > highest) highest = s;
    if (s < lowest) lowest = s;
  }
  const avg = sum / scores.length;

  const peak = Math.max(...buckets.map((b) => b.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Score distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Candidates" value={String(total ?? scores.length)} />
          <Stat label="Average" value={`${avg.toFixed(1)}%`} />
          <Stat label="Highest" value={`${highest.toFixed(1)}%`} />
          <Stat label="Lowest" value={`${lowest.toFixed(1)}%`} />
        </div>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={buckets} barCategoryGap="20%">
              <XAxis
                dataKey="range"
                tick={{ fontSize: 10, fill: "var(--color-muted)" }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--color-muted)" }}
                width={28}
              />
              <Tooltip
                cursor={{ fill: "var(--color-surface-2)" }}
                formatter={(v: number) => [`${v} candidates`, "Count"]}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid var(--color-border)",
                  fontSize: 12,
                  background: "var(--color-surface)",
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {buckets.map((b, i) => (
                  <Cell
                    key={i}
                    fill={
                      b.count === peak && peak > 0
                        ? "var(--color-brand)"
                        : "var(--color-brand-soft)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-3 text-center">
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
