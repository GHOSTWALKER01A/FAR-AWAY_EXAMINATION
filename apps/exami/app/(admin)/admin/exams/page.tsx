"use client";

import { useState } from "react";
import Link from "next/link";
import { useExams } from "@/lib/hooks/queries";
import { PageHeader, EmptyState, LoadingBlock } from "@/components/ui/misc";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fmtDate } from "@/lib/utils";
import { Plus } from "lucide-react";
import type { ExamStatus, ExamMode } from "@/lib/types";

export default function AdminExams() {
  const [status, setStatus] = useState<ExamStatus | "">("");
  const [mode, setMode] = useState<ExamMode | "">("");
  const { data, isLoading } = useExams({
    status: status || undefined,
    mode: mode || undefined,
  });

  return (
    <div>
      <PageHeader
        title="All exams"
        subtitle="Every exam across the institution."
        actions={
          <Link href="/examiner/exams/create">
            <Button>
              <Plus className="h-4 w-4" /> Create exam
            </Button>
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as ExamStatus | "")}
          className="w-44"
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="LIVE">Live</option>
          <option value="CLOSED">Closed</option>
          <option value="RESULTS_PUBLISHED">Results published</option>
        </Select>
        <Select
          value={mode}
          onChange={(e) => setMode(e.target.value as ExamMode | "")}
          className="w-44"
        >
          <option value="">All modes</option>
          <option value="ADAPTIVE">Adaptive</option>
          <option value="FIXED">Fixed</option>
          <option value="RANDOMISED">Randomised</option>
        </Select>
      </div>

      {isLoading ? (
        <LoadingBlock />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No exams found" message="Try adjusting the filters." />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Title</TH>
              <TH>Mode</TH>
              <TH>Status</TH>
              <TH>Start</TH>
              <TH>Enrolled</TH>
              <TH>Action</TH>
            </tr>
          </THead>
          <tbody>
            {data.map((e) => (
              <TR key={e.id}>
                <TD className="font-medium">{e.title}</TD>
                <TD>
                  <Badge tone="brand">{e.mode}</Badge>
                </TD>
                <TD>
                  <StatusBadge status={e.status} />
                </TD>
                <TD className="text-[var(--color-muted)]">
                  {fmtDate(e.startAt)}
                </TD>
                <TD>{e.enrolledCount ?? "—"}</TD>
                <TD>
                  <Link
                    href={`/examiner/exams/${e.id}`}
                    className="text-sm font-medium text-[var(--color-brand)]"
                  >
                    View
                  </Link>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
