import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2, Inbox } from "lucide-react";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin", className)} />;
}

export function Skeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "animate-pulse-soft rounded-md bg-[var(--color-surface-2)]",
        className,
      )}
    />
  );
}

export function EmptyState({
  title,
  message,
  icon,
  action,
}: {
  title: string;
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-12 text-center">
      <div className="mb-3 text-[var(--color-muted-2)]">
        {icon ?? <Inbox className="h-8 w-8" />}
      </div>
      <p className="font-medium">{title}</p>
      {message && (
        <p className="mt-1 max-w-sm text-sm text-[var(--color-muted)]">
          {message}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-[var(--color-muted)]">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function LoadingBlock() {
  return (
    <div className="flex items-center justify-center py-16 text-[var(--color-muted)]">
      <Spinner />
    </div>
  );
}
