"use client";

import { useState } from "react";
import { useAiDraft, useCreateQuestion } from "@/lib/hooks/queries";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Check, X } from "lucide-react";
import type { Difficulty, QuestionType, QuestionDraft } from "@/lib/types";

export default function AiGenerate() {
  const draft = useAiDraft();
  const create = useCreateQuestion();
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [type, setType] = useState<QuestionType>("MCQ");
  const [drafts, setDrafts] = useState<QuestionDraft[]>([]);

  const generate = async () => {
    const res = await draft.mutateAsync({ topic, count, difficulty, type, language: "English" });
    setDrafts(res.drafts);
  };

  const saveDraft = async (d: QuestionDraft, idx: number) => {
    await create.mutateAsync({
      type: d.type,
      stem: d.stem,
      marks: d.marks ?? 4,
      difficulty: d.difficulty,
      options: d.options,
      correctKey: d.correctKey,
      rubric: d.rubric,
    });
    setDrafts((ds) => ds.filter((_, i) => i !== idx));
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="AI question studio"
        subtitle="Generate drafts, review, then save. Nothing is auto-saved."
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Generate</CardTitle>
        </CardHeader>
        <CardContent>
          <Field label="Topic">
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Thermodynamics"
            />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label={`Count: ${count}`}>
              <input
                type="range"
                min={1}
                max={20}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full"
              />
            </Field>
            <Field label="Difficulty">
              <Select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </Select>
            </Field>
            <Field label="Type">
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as QuestionType)}
              >
                <option value="MCQ">MCQ</option>
                <option value="SHORT">Short</option>
                <option value="LONG">Long</option>
              </Select>
            </Field>
          </div>
          <Button
            onClick={generate}
            loading={draft.isPending}
            disabled={topic.trim().length < 3}
          >
            <Sparkles className="h-4 w-4" /> Generate {count} drafts
          </Button>
        </CardContent>
      </Card>

      {drafts.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-[var(--color-muted)]">
            {drafts.length} drafts — review & edit before saving.
          </p>
          {drafts.map((d, i) => (
            <Card key={i}>
              <CardContent className="pt-5">
                <div className="mb-2 flex items-center gap-2">
                  <Badge tone="info">AI</Badge>
                  <Badge tone="brand">{d.type}</Badge>
                  <Badge tone="neutral">{d.difficulty}</Badge>
                </div>
                <p className="mb-3 font-medium">{d.stem}</p>
                {d.options && (
                  <ul className="mb-3 space-y-1 text-sm">
                    {d.options.map((o) => (
                      <li
                        key={o.id}
                        className={
                          d.correctKey?.optionIds?.includes(o.id)
                            ? "font-medium text-[var(--color-success)]"
                            : "text-[var(--color-muted)]"
                        }
                      >
                        {d.correctKey?.optionIds?.includes(o.id) ? "✓ " : "• "}
                        {o.text}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDrafts((ds) => ds.filter((_, x) => x !== i))}
                  >
                    <X className="h-4 w-4" /> Discard
                  </Button>
                  <Button
                    size="sm"
                    loading={create.isPending}
                    onClick={() => saveDraft(d, i)}
                  >
                    <Check className="h-4 w-4" /> Save to bank
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
