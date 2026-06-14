"use client";

import { cn } from "@/lib/utils";
import { Textarea, Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { NextItem } from "@/lib/types";

export type AnswerValue =
  | { optionIds: string[] }
  | { text: string }
  | { value: number };

/**
 * Renders a question of any type and produces the typed `answer` payload
 * the backend expects. Never receives or shows the correct key.
 */
export function QuestionRenderer({
  item,
  value,
  onChange,
}: {
  item: NextItem;
  value: AnswerValue | null;
  onChange: (v: AnswerValue) => void;
}) {
  const selected =
    value && "optionIds" in value ? value.optionIds : ([] as string[]);

  const toggle = (id: string, multi: boolean) => {
    if (multi) {
      const next = selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id];
      onChange({ optionIds: next });
    } else {
      onChange({ optionIds: [id] });
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Badge tone="brand">{item.type}</Badge>
        <Badge tone="neutral">{item.difficulty}</Badge>
        <Badge tone="info">{item.marks} marks</Badge>
      </div>

      <p className="mb-6 whitespace-pre-wrap text-lg leading-relaxed">
        {item.stem}
      </p>

      {(item.type === "MCQ" || item.type === "MULTI_SELECT") && (
        <div className="space-y-2.5">
          {item.options?.map((opt) => {
            const isMulti = item.type === "MULTI_SELECT";
            const active = selected.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggle(opt.id, isMulti)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
                  active
                    ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)]",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center border text-xs font-semibold",
                    isMulti ? "rounded" : "rounded-full",
                    active
                      ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                      : "border-[var(--color-muted-2)]",
                  )}
                >
                  {active ? "✓" : ""}
                </span>
                <span>{opt.text}</span>
              </button>
            );
          })}
        </div>
      )}

      {(item.type === "SHORT" || item.type === "LONG" || item.type === "CODE") && (
        <Textarea
          className={cn(
            item.type === "LONG" || item.type === "CODE" ? "min-h-48" : "min-h-28",
            item.type === "CODE" && "font-mono",
          )}
          placeholder="Type your answer…"
          value={value && "text" in value ? value.text : ""}
          onChange={(e) => onChange({ text: e.target.value })}
        />
      )}

      {item.type === "NUMERIC" && (
        <Input
          type="number"
          placeholder="Enter a number"
          value={value && "value" in value ? value.value : ""}
          onChange={(e) => onChange({ value: Number(e.target.value) })}
        />
      )}
    </div>
  );
}
