"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="mb-5 flex gap-1 border-b border-[var(--color-border)]">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
            value === t.key
              ? "border-[var(--color-brand)] text-[var(--color-brand)]"
              : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-fg)]",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
