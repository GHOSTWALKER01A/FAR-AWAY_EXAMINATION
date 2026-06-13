import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      tone: {
        neutral: "bg-[var(--color-surface-2)] text-[var(--color-muted)]",
        brand: "bg-[var(--color-brand-soft)] text-[var(--color-brand)]",
        success: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
        warning: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
        danger: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
        info: "bg-[var(--color-info-soft)] text-[var(--color-info)]",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

/** Map an exam status to a badge tone + label. */
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { tone: BadgeProps["tone"]; label: string }> = {
    DRAFT: { tone: "neutral", label: "Draft" },
    SCHEDULED: { tone: "info", label: "Scheduled" },
    LIVE: { tone: "success", label: "Live" },
    CLOSED: { tone: "warning", label: "Closed" },
    RESULTS_PUBLISHED: { tone: "brand", label: "Results out" },
  };
  const m = map[status] ?? { tone: "neutral" as const, label: status };
  return <Badge tone={m.tone}>{m.label}</Badge>;
}
