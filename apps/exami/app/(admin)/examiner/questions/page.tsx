"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useQuestions } from "@/lib/hooks/queries";
import { PageHeader, EmptyState, LoadingBlock } from "@/components/ui/misc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Plus, Upload, Sparkles, RefreshCw } from "lucide-react";
import type { Difficulty, QuestionType, Question } from "@/lib/types";

const DIFF_TONE: Record<Difficulty, "success" | "warning" | "danger"> = {
  EASY: "success",
  MEDIUM: "warning",
  HARD: "danger",
};

const TYPE_LABEL: Record<QuestionType, string> = {
  MCQ: "MCQ",
  MULTI_SELECT: "Multi-select",
  SHORT: "Short",
  LONG: "Long",
  NUMERIC: "Numeric",
  CODE: "Code",
};

export default function QuestionBank() {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");
  const [type, setType] = useState<QuestionType | "">("");

  const { data, isLoading, isError, refetch } = useQuestions({
    difficulty: difficulty || undefined,
    type: type || undefined,
  });

  // Client-side text search on top of server-side type/difficulty filter
  const questionsList = Array.isArray(data) ? data : (data as any)?.items ?? [];
  const filtered = questionsList.filter((q: Question) =>
    search ? q.stem.toLowerCase().includes(search.toLowerCase()) : true,
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
          <option value="MULTI_SELECT">Multi-select</option>
          <option value="SHORT">Short</option>
          <option value="LONG">Long</option>
          <option value="NUMERIC">Numeric</option>
          <option value="CODE">Code</option>
        </Select>
      </div>

      {isLoading ? (
        <LoadingBlock />
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-sm text-danger">
            Failed to load questions. Check your connection or permissions.
          </p>
          <Button variant="outline" onClick={() => void refetch()}>
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={search || difficulty || type ? "No matching questions" : "No questions yet"}
          message={
            search || difficulty || type
              ? "Try adjusting the filters."
              : "Add one manually, import a CSV, or generate with AI."
          }
        />
      ) : (
        <div className="space-y-2">
          <p className="mb-2 text-xs text-muted">
            {filtered.length} question{filtered.length !== 1 ? "s" : ""}
            {search || difficulty || type ? " (filtered)" : ""}
          </p>
          {filtered.map((q: Question) => (
            <Card key={q.id} className="flex items-center gap-4 p-4">
              <div className="flex-1 min-w-0">
                <p className="line-clamp-2 font-medium">{q.stem}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <Badge tone="brand">{TYPE_LABEL[q.type] ?? q.type}</Badge>
                  <Badge tone={DIFF_TONE[q.difficulty] ?? "neutral"}>{q.difficulty}</Badge>
                  <Badge tone="neutral">{q.marks} mark{q.marks !== 1 ? "s" : ""}</Badge>
                  {q.calibrationStatus && (
                    <Badge
                      tone={
                        q.calibrationStatus === "CALIBRATED"
                          ? "success"
                          : q.calibrationStatus === "FIELD_TEST"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {q.calibrationStatus === "CALIBRATED"
                        ? "Calibrated"
                        : q.calibrationStatus === "FIELD_TEST"
                          ? "Field test"
                          : "Uncalibrated"}
                    </Badge>
                  )}
                  {q.provenance === "AI" && <Badge tone="info">AI</Badge>}
                  {q.topicTags?.slice(0, 3).map((t) => (
                    <span key={t} className="text-xs text-muted">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
              <Link
                href={`/examiner/questions/new?id=${q.id}`}
                className="shrink-0 text-sm font-medium text-brand hover:underline"
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
