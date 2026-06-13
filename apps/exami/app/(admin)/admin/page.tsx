"use client";

import Link from "next/link";
import { useExams } from "@/lib/hooks/queries";
import { useGrievances } from "@/lib/hooks/queries";
import { StatCard } from "@/components/shared/stat-card";
import { ExamCard } from "@/components/shared/exam-card";
import { PageHeader, EmptyState, LoadingBlock } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Radio, CalendarClock, ShieldAlert, MessageSquareWarning, Plus } from "lucide-react";

export default function AdminOverview() {
  const live = useExams({ status: "LIVE" });
  const scheduled = useExams({ status: "SCHEDULED" });
  const grievances = useGrievances("OPEN");

  return (
    <div>
      <PageHeader
        title="Institution overview"
        subtitle="A live snapshot of exams, monitoring and pending actions."
        actions={
          <Link href="/examiner/exams/create">
            <Button>
              <Plus className="h-4 w-4" /> Create exam
            </Button>
          </Link>
        }
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Exams live now"
          value={live.data?.length ?? "—"}
          icon={<Radio className="h-5 w-5" />}
          tone="success"
        />
        <StatCard
          label="Scheduled"
          value={scheduled.data?.length ?? "—"}
          icon={<CalendarClock className="h-5 w-5" />}
          tone="info"
        />
        <StatCard
          label="Open grievances"
          value={grievances.data?.length ?? "—"}
          icon={<MessageSquareWarning className="h-5 w-5" />}
          tone="warning"
        />
        <StatCard
          label="Proctoring alerts"
          value={live.data?.length ? "Monitor" : 0}
          icon={<ShieldAlert className="h-5 w-5" />}
          tone="danger"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Live exams</CardTitle>
          <Link
            href="/admin/proctoring"
            className="text-sm font-medium text-[var(--color-brand)]"
          >
            Proctoring center →
          </Link>
        </CardHeader>
        <CardContent>
          {live.isLoading ? (
            <LoadingBlock />
          ) : live.data && live.data.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {live.data.map((e) => (
                <ExamCard
                  key={e.id}
                  exam={e}
                  href={`/monitor/${e.id}`}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No exams are live"
              message="Live exams will appear here for real-time monitoring."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
