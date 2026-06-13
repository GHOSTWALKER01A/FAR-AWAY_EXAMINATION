"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuestions } from "@/lib/hooks/queries";
import { PageHeader, EmptyState, LoadingBlock } from "@/components/ui/misc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Plus, Upload, Sparkles } from "lucide-react";
import type { Difficulty, QuestionType } from "@/lib/types";

const DIFF_TONE: Record<Difficulty, "success" | "warning" | "danger"> = {
  EASY: "success",
  MEDIUM: "warning",
  HARD: "danger",
};

export default function QuestionBank() {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");
  const [type, setType] = useState<QuestionType | "">("");
  const { data, isLoading } = useQuestions({
    difficulty: difficulty || undefined,
    type: type || undefined,
  });

  const filtered = (data ?? []).filter((q) =>
    q.stem.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <PageHeader
        title="Question bank"
        subtitle="Author, import and AI-generate questions."
        actions={
          <div className="flex gap-2">
            <Link href="/examiner/questions/import">
              <Button variant="outline">
                <Upload className="h-4 w-4" /> Import
              </Button>
            </Link>
            <Link href="/examiner/questions/ai-generate">
              <Button variant="outline">
                <Sparkles className="h-4 w-4" /> AI generate
              </Button>
            </Link>
            <Link href="/examiner/questions/new">
              <Button>
                <Plus className="h-4 w-4" /> Add question
              </Button>
            </Link>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          placeholder="Search question text…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Difficulty | "")}
          className="w-40"
        >
          <option value="">All difficulty</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </Select>
        <Select
          value={type}
          onChange={(e) => setType(e.target.value as QuestionType | "")}
          className="w-40"
        >
          <option value="">All types</option>
          <option value="MCQ">MCQ</option>
          <option value="MULTI">Multi-select</option>
          <option value="SHORT">Short</option>
          <option value="LONG">Long</option>
          <option value="NUMERIC">Numeric</option>
          <option value="CODE">Code</option>
        </Select>
      </div>

      {isLoading ? (
        <LoadingBlock />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No questions"
          message="Add one manually, import a CSV, or generate with AI."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((q) => (
            <Card key={q.id} className="flex items-center gap-4 p-4">
              <div className="flex-1">
                <p className="line-clamp-1 font-medium">{q.stem}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <Badge tone="brand">{q.type}</Badge>
                  <Badge tone={DIFF_TONE[q.difficulty]}>{q.difficulty}</Badge>
                  <Badge tone="neutral">{q.marks} marks</Badge>
                  {q.calibrationStatus && (
                    <Badge
                      tone={
                        q.calibrationStatus === "CALIBRATED" ? "success" : "neutral"
                      }
                    >
                      {q.calibrationStatus}
                    </Badge>
                  )}
                  {q.provenance === "AI" && <Badge tone="info">AI</Badge>}
                  {q.topicTags?.slice(0, 2).map((t) => (
                    <span key={t} className="text-xs text-[var(--color-muted)]">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
              <Link
                href={`/examiner/questions/new?id=${q.id}`}
                className="text-sm font-medium text-[var(--color-brand)]"
              >
                Edit
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
