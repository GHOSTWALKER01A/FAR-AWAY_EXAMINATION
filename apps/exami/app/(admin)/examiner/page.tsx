"use client";

import Link from "next/link";
import { useExams, useGrievances } from "@/lib/hooks/queries";
import { StatCard } from "@/components/shared/stat-card";
import { ExamCard } from "@/components/shared/exam-card";
import { PageHeader, EmptyState, LoadingBlock } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText, Radio, FilePen, MessageSquareWarning, Plus, BookOpen, Sparkles } from "lucide-react";

export default function ExaminerHome() {
  const all = useExams();
  const live = useExams({ status: "LIVE" });
  const drafts = useExams({ status: "DRAFT" });
  const grievances = useGrievances("OPEN");

  return (
    <div>
      <PageHeader
        title="Examiner dashboard"
        subtitle="Author exams, manage your question bank, grade and publish."
        actions={
          <div className="flex gap-2">
            <Link href="/examiner/questions/ai-generate">
              <Button variant="outline">
                <Sparkles className="h-4 w-4" /> AI generate
              </Button>
            </Link>
            <Link href="/examiner/exams/create">
              <Button>
                <Plus className="h-4 w-4" /> Create exam
              </Button>
            </Link>
          </div>
        }
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total exams" value={all.data?.length ?? "—"} icon={<FileText className="h-5 w-5" />} />
        <StatCard label="Live now" value={live.data?.length ?? "—"} icon={<Radio className="h-5 w-5" />} tone="success" />
        <StatCard label="Drafts" value={drafts.data?.length ?? "—"} icon={<FilePen className="h-5 w-5" />} tone="info" />
        <StatCard label="Open grievances" value={grievances.data?.length ?? "—"} icon={<MessageSquareWarning className="h-5 w-5" />} tone="warning" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link href="/examiner/questions">
          <Card className="flex items-center gap-3 p-4 transition-shadow hover:shadow-md">
            <BookOpen className="h-5 w-5 text-[var(--color-brand)]" />
            <span className="font-medium">Question bank</span>
          </Card>
        </Link>
        <Link href="/examiner/questions/import">
          <Card className="flex items-center gap-3 p-4 transition-shadow hover:shadow-md">
            <FileText className="h-5 w-5 text-[var(--color-brand)]" />
            <span className="font-medium">Bulk import</span>
          </Card>
        </Link>
        <Link href="/examiner/grievances">
          <Card className="flex items-center gap-3 p-4 transition-shadow hover:shadow-md">
            <MessageSquareWarning className="h-5 w-5 text-[var(--color-brand)]" />
            <span className="font-medium">Review grievances</span>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My exams</CardTitle>
        </CardHeader>
        <CardContent>
          {all.isLoading ? (
            <LoadingBlock />
          ) : all.data && all.data.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {all.data.map((e) => (
                <ExamCard key={e.id} exam={e} href={`/examiner/exams/${e.id}`} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No exams yet"
              message="Create your first exam to get started."
              action={
                <Link href="/examiner/exams/create">
                  <Button>
                    <Plus className="h-4 w-4" /> Create exam
                  </Button>
                </Link>
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
