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
export function ScoreDistribution({ scores }: { scores: number[] }) {
  const buckets = Array.from({ length: 10 }, (_, i) => ({
    range: `${i * 10}-${i * 10 + 10}`,
    count: 0,
  }));
  for (const s of scores) {
    const idx = Math.min(9, Math.max(0, Math.floor(s / 10)));
    buckets[idx].count += 1;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Score distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={buckets}>
              <XAxis
                dataKey="range"
                tick={{ fontSize: 11, fill: "var(--color-muted)" }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--color-muted)" }}
              />
              <Tooltip
                cursor={{ fill: "var(--color-surface-2)" }}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid var(--color-border)",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {buckets.map((_, i) => (
                  <Cell key={i} fill="var(--color-brand)" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
