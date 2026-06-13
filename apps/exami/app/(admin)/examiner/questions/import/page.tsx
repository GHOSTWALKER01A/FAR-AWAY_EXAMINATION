"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { questionsApi, type BulkPreviewResult } from "@/lib/api/questions";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/store/toast";
import { cn } from "@/lib/utils";
import { UploadCloud, CheckCircle2, XCircle } from "lucide-react";

export default function BulkImport() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<BulkPreviewResult | null>(null);

  const previewMut = useMutation({
    mutationFn: (file: File) => questionsApi.bulkPreview(file),
    onSuccess: (res) => setPreview(res),
    onError: (e: Error) => toast.error("Preview failed", e.message),
  });

  const commitMut = useMutation({
    mutationFn: () => questionsApi.bulkCommit(preview!.previewId),
    onSuccess: (res) => {
      toast.success(`${res.committed} questions imported`);
      router.push("/examiner/questions");
    },
    onError: (e: Error) => toast.error("Commit failed", e.message),
  });

  const handleFile = (f?: File) => {
    if (f) previewMut.mutate(f);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Bulk import"
        subtitle="Upload a CSV. We preview before anything is saved."
      />

      {!preview ? (
        <Card>
          <CardContent className="pt-5">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                handleFile(e.dataTransfer.files?.[0]);
              }}
              onClick={() => fileRef.current?.click()}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition-colors",
                dragging
                  ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]"
                  : "border-[var(--color-border)] hover:bg-[var(--color-surface-2)]",
              )}
            >
              <UploadCloud className="mb-3 h-10 w-10 text-[var(--color-muted-2)]" />
              <p className="font-medium">Drop a CSV here or click to browse</p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Columns: type, stem, options, correctKey, marks, difficulty, topicTags
              </p>
              {previewMut.isPending && (
                <p className="mt-3 text-sm text-[var(--color-brand)]">Parsing…</p>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              hidden
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-5">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Badge tone="neutral">{preview.total} rows</Badge>
              <Badge tone="success">
                <CheckCircle2 className="h-3.5 w-3.5" /> {preview.valid} valid
              </Badge>
              {preview.errors.length > 0 && (
                <Badge tone="danger">
                  <XCircle className="h-3.5 w-3.5" /> {preview.errors.length} errors
                </Badge>
              )}
            </div>

            {preview.errors.length > 0 && (
              <Table className="mb-4">
                <THead>
                  <tr>
                    <TH>Row</TH>
                    <TH>Error</TH>
                  </tr>
                </THead>
                <tbody>
                  {preview.errors.map((er) => (
                    <TR key={er.row}>
                      <TD className="text-[var(--color-danger)]">#{er.row}</TD>
                      <TD>{er.error}</TD>
                    </TR>
                  ))}
                </tbody>
              </Table>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setPreview(null)}>
                Upload another
              </Button>
              <Button
                onClick={() => commitMut.mutate()}
                loading={commitMut.isPending}
                disabled={preview.valid === 0}
              >
                Import {preview.valid} valid questions
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
