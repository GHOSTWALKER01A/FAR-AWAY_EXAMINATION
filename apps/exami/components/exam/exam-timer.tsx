"use client";

import { fmtClock, cn } from "@/lib/utils";
import { Clock } from "lucide-react";

export function ExamTimer({ remaining }: { remaining: number }) {
  const danger = remaining <= 60;
  const warn = remaining <= 300;
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-1.5 font-mono text-lg font-semibold tabular-nums",
        danger
          ? "animate-pulse bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
          : warn
            ? "bg-[var(--color-warning-soft)] text-[var(--color-warning)]"
            : "bg-[var(--color-surface-2)] text-[var(--color-fg)]",
      )}
    >
      <Clock className="h-4 w-4" />
      {fmtClock(remaining)}
    </div>
  );
}
