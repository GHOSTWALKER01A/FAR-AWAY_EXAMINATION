import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { fmtDate } from "@/lib/utils";
import { Users, Clock } from "lucide-react";
import type { Exam } from "@/lib/types";

export function ExamCard({ exam, href }: { exam: Exam; href: string }) {
  return (
    <Link href={href}>
      <Card className="p-5 transition-shadow hover:shadow-md">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight">{exam.title}</h3>
          <StatusBadge status={exam.status} />
        </div>
        {exam.description && (
          <p className="mb-3 line-clamp-2 text-sm text-[var(--color-muted)]">
            {exam.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
          <Badge tone="brand">{exam.mode}</Badge>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {Math.round(exam.durationSeconds / 60)} min
          </span>
          {typeof exam.enrolledCount === "number" && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {exam.enrolledCount}
            </span>
          )}
          {exam.startAt && <span>· {fmtDate(exam.startAt)}</span>}
        </div>
      </Card>
    </Link>
  );
}
