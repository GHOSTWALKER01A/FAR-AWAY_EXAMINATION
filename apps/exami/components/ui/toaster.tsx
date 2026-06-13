"use client";

import { useToastStore, type ToastKind } from "@/lib/store/toast";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<ToastKind, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-[var(--color-success)]" />,
  error: <XCircle className="h-5 w-5 text-[var(--color-danger)]" />,
  info: <Info className="h-5 w-5 text-[var(--color-info)]" />,
  warning: <AlertTriangle className="h-5 w-5 text-[var(--color-warning)]" />,
};

const ACCENT: Record<ToastKind, string> = {
  success: "border-l-[var(--color-success)]",
  error: "border-l-[var(--color-danger)]",
  info: "border-l-[var(--color-info)]",
  warning: "border-l-[var(--color-warning)]",
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex items-start gap-3 rounded-lg border border-l-4 border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-lg",
            ACCENT[t.kind],
          )}
        >
          <div className="mt-0.5">{ICONS[t.kind]}</div>
          <div className="flex-1">
            <p className="text-sm font-medium">{t.title}</p>
            {t.message && (
              <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                {t.message}
              </p>
            )}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="text-[var(--color-muted-2)] hover:text-[var(--color-fg)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
