"use client";

import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { enrolmentApi } from "@/lib/api/enrolment";
import { useEnrolments, useCancelEnrolment } from "@/lib/hooks/queries";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingBlock } from "@/components/ui/misc";
import { toast } from "@/lib/store/toast";
import { Upload } from "lucide-react";
import type { EnrolmentStatus } from "@/lib/types";

const TONE: Record<EnrolmentStatus, "success" | "warning" | "neutral" | "danger"> = {
  ENROLLED: "success",
  WAITLISTED: "warning",
  ABSENT: "neutral",
  CANCELLED: "danger",
};

export function RosterPanel({ examId }: { examId: string }) {
  const { data, isLoading, refetch } = useEnrolments(examId);
  const cancel = useCancelEnrolment(examId);
  const fileRef = useRef<HTMLInputElement>(null);
  const [report, setReport] = useState<{ created: number; errors: { row: number; error: string }[] } | null>(null);

  const importMut = useMutation({
    mutationFn: (file: File) => enrolmentApi.importRoster(examId, file),
    onSuccess: (res) => {
      setReport(res);
      toast.success(`${res.created} students imported`, res.errors.length ? `${res.errors.length} rows had errors.` : undefined);
      refetch();
    },
    onError: (e: Error) => toast.error("Import failed", e.message),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-[var(--color-muted)]">
          CSV columns: <code>name,email,phone</code>
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importMut.mutate(f);
            e.target.value = "";
          }}
        />
        <Button variant="outline" onClick={() => fileRef.current?.click()} loading={importMut.isPending}>
          <Upload className="h-4 w-4" /> Import roster
        </Button>
      </div>

      {report && report.errors.length > 0 && (
        <div className="mb-4 rounded-lg border border-[var(--color-warning)]/40 bg-[var(--color-warning-soft)] p-3 text-sm">
          <p className="font-medium text-[var(--color-warning)]">
            {report.errors.length} rows skipped
          </p>
          <ul className="mt-1 text-[var(--color-muted)]">
            {report.errors.slice(0, 5).map((er) => (
              <li key={er.row}>Row {er.row}: {er.error}</li>
            ))}
          </ul>
        </div>
      )}

      {isLoading ? (
        <LoadingBlock />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No students enrolled" message="Import a roster or share the self-registration link." />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Name</TH>
              <TH>Email</TH>
              <TH>Status</TH>
              <TH>Action</TH>
            </tr>
          </THead>
          <tbody>
            {data.map((en) => (
              <TR key={en.id}>
                <TD className="font-medium">{en.user.name}</TD>
                <TD className="text-[var(--color-muted)]">{en.user.email}</TD>
                <TD>
                  <Badge tone={TONE[en.status]}>{en.status}</Badge>
                </TD>
                <TD>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => cancel.mutate(en.user.id)}
                  >
                    Remove
                  </Button>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
