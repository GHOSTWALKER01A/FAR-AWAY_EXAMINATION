"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateQuestion } from "@/lib/hooks/queries";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Textarea, Select, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import type { QuestionType, Difficulty } from "@/lib/types";

let optCounter = 0;
const newOpt = () => ({ id: `o${++optCounter}`, text: "" });

export default function NewQuestion() {
  const router = useRouter();
  const create = useCreateQuestion();

  const [type, setType] = useState<QuestionType>("MCQ");
  const [stem, setStem] = useState("");
  const [marks, setMarks] = useState(4);
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [tags, setTags] = useState("");
  const [options, setOptions] = useState([newOpt(), newOpt(), newOpt(), newOpt()]);
  const [correct, setCorrect] = useState<string[]>([]);
  const [criteria, setCriteria] = useState([{ criterion: "", max: 5 }]);
  const [numeric, setNumeric] = useState({ value: 0, tolerance: 0 });

  const isChoice = type === "MCQ" || type === "MULTI";
  const isSubjective = type === "SHORT" || type === "LONG" || type === "CODE";

  const toggleCorrect = (id: string) => {
    if (type === "MCQ") setCorrect([id]);
    else
      setCorrect((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  };

  const valid =
    stem.trim().length > 3 &&
    (!isChoice || (options.every((o) => o.text.trim()) && correct.length > 0)) &&
    (!isSubjective || criteria.every((c) => c.criterion.trim()));

  const submit = async () => {
    await create.mutateAsync({
      type,
      stem,
      marks,
      difficulty,
      topicTags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      options: isChoice ? options : undefined,
      correctKey: isChoice
        ? { optionIds: correct }
        : type === "NUMERIC"
          ? { value: numeric.value }
          : undefined,
      rubric: isSubjective ? { criteria } : undefined,
    });
    router.push("/examiner/questions");
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Add question" subtitle="Author a new bank item." />
      <Card>
        <CardContent className="pt-5">
          <Field label="Type">
            <Select
              value={type}
              onChange={(e) => setType(e.target.value as QuestionType)}
            >
              <option value="MCQ">MCQ (single correct)</option>
              <option value="MULTI">Multi-select</option>
              <option value="SHORT">Short answer</option>
              <option value="LONG">Long answer</option>
              <option value="NUMERIC">Numeric</option>
              <option value="CODE">Code</option>
            </Select>
          </Field>

          <Field label="Question stem">
            <Textarea
              value={stem}
              onChange={(e) => setStem(e.target.value)}
              placeholder="Type the question…"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Marks">
              <Input
                type="number"
                value={marks}
                onChange={(e) => setMarks(Number(e.target.value))}
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
          </div>

          <Field label="Topic tags" hint="Comma-separated">
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="astronomy, solar-system"
            />
          </Field>

          {isChoice && (
            <div className="mb-4">
              <Label>Options (click the circle to mark correct)</Label>
              <div className="space-y-2">
                {options.map((o, i) => (
                  <div key={o.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleCorrect(o.id)}
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs",
                        correct.includes(o.id)
                          ? "border-[var(--color-success)] bg-[var(--color-success)] text-white"
                          : "border-[var(--color-muted-2)]",
                      )}
                    >
                      {correct.includes(o.id) ? "✓" : String.fromCharCode(65 + i)}
                    </button>
                    <Input
                      value={o.text}
                      onChange={(e) => {
                        const next = [...options];
                        next[i] = { ...o, text: e.target.value };
                        setOptions(next);
                      }}
                      placeholder={`Option ${i + 1}`}
                    />
                    {options.length > 2 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setOptions(options.filter((x) => x.id !== o.id))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => setOptions([...options, newOpt()])}
              >
                <Plus className="h-4 w-4" /> Add option
              </Button>
            </div>
          )}

          {isSubjective && (
            <div className="mb-4">
              <Label>Rubric (required for subjective grading)</Label>
              <div className="space-y-2">
                {criteria.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={c.criterion}
                      onChange={(e) => {
                        const next = [...criteria];
                        next[i] = { ...c, criterion: e.target.value };
                        setCriteria(next);
                      }}
                      placeholder="Criterion"
                    />
                    <Input
                      type="number"
                      className="w-24"
                      value={c.max}
                      onChange={(e) => {
                        const next = [...criteria];
                        next[i] = { ...c, max: Number(e.target.value) };
                        setCriteria(next);
                      }}
                    />
                    {criteria.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setCriteria(criteria.filter((_, x) => x !== i))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => setCriteria([...criteria, { criterion: "", max: 5 }])}
              >
                <Plus className="h-4 w-4" /> Add criterion
              </Button>
            </div>
          )}

          {type === "NUMERIC" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Correct value">
                <Input
                  type="number"
                  value={numeric.value}
                  onChange={(e) =>
                    setNumeric({ ...numeric, value: Number(e.target.value) })
                  }
                />
              </Field>
              <Field label="Tolerance ±">
                <Input
                  type="number"
                  value={numeric.tolerance}
                  onChange={(e) =>
                    setNumeric({ ...numeric, tolerance: Number(e.target.value) })
                  }
                />
              </Field>
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={!valid} loading={create.isPending}>
              Save question
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
