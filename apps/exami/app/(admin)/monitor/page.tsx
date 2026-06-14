"use client";

import Link from "next/link";
import { useExams } from "@/lib/hooks/queries";
import { PageHeader, EmptyState, LoadingBlock } from "@/components/ui/misc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Users } from "lucide-react";

export default function MonitorHome() {
  const { data, isLoading } = useExams({ status: "LIVE" });

  return (
    <div>
      <PageHeader
        title="Live monitor"
        subtitle="Exams you can invigilate right now."
      />
      {isLoading ? (
        <LoadingBlock />
      ) : !data || (Array.isArray(data) ? data : (data as any).items ?? []).length === 0 ? (
        <EmptyState
          title="Nothing live"
          message="When an exam goes live, it appears here to monitor."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(Array.isArray(data) ? data : (data as any).items ?? []).map((e: any) => (
            <Link key={e.id} href={`/monitor/${e.id}`}>
              <Card className="p-5 transition-shadow hover:shadow-md">
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="font-semibold">{e.title}</h3>
                  <Badge tone="success">Live</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-[var(--color-muted)]">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {e.enrolledCount ?? 0}
                  </span>
                  <span className="flex items-center gap-1 text-[var(--color-brand)]">
                    <Eye className="h-4 w-4" /> Watch
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
