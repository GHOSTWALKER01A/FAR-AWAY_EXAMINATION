"use client";

import Link from "next/link";
import { useExams } from "@/lib/hooks/queries";
import { StudentTopbar } from "@/components/shared/student-topbar";
import { PageHeader, EmptyState, LoadingBlock } from "@/components/ui/misc";
import { Card } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fmtDate } from "@/lib/utils";
import { Clock, ArrowRight } from "lucide-react";

export default function StudentExams() {
  const live = useExams({ status: "LIVE" });
  const scheduled = useExams({ status: "SCHEDULED" });
  const published = useExams({ status: "RESULTS_PUBLISHED" });

  const loading = live.isLoading || scheduled.isLoading;

  return (
    <div>
      <StudentTopbar />
      <div className="mx-auto max-w-5xl px-6 py-8">
        <PageHeader title="My exams" subtitle="Take exams and view your results." />

        {loading ? (
          <LoadingBlock />
        ) : (
          <div className="space-y-8">
            <Section title="Live now" tone="success">
              {live.data?.length ? (
                live.data.map((e) => (
                  <Card key={e.id} className="flex items-center justify-between p-5">
                    <div>
                      <p className="font-semibold">{e.title}</p>
                      <div className="mt-1 flex items-center gap-2 text-sm text-[var(--color-muted)]">
                        <Badge tone="brand">{e.mode}</Badge>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {Math.round(e.durationSeconds / 60)} min
                        </span>
                      </div>
                    </div>
                    <Link href={`/exams/${e.id}/check`}>
                      <Button>
                        Enter <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </Card>
                ))
              ) : (
                <EmptyState title="Nothing live" message="No exams are open right now." />
              )}
            </Section>

            {scheduled.data && scheduled.data.length > 0 && (
              <Section title="Upcoming" tone="info">
                {scheduled.data.map((e) => (
                  <Card key={e.id} className="flex items-center justify-between p-5">
                    <div>
                      <p className="font-semibold">{e.title}</p>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">
                        Opens {fmtDate(e.startAt)}
                      </p>
                    </div>
                    <Link href={`/exams/${e.id}/register`}>
                      <Button variant="outline">Register</Button>
                    </Link>
                  </Card>
                ))}
              </Section>
            )}

            {published.data && published.data.length > 0 && (
              <Section title="Completed" tone="neutral">
                {published.data.map((e) => (
                  <Card key={e.id} className="flex items-center justify-between p-5">
                    <div>
                      <p className="font-semibold">{e.title}</p>
                      <StatusBadge status={e.status} />
                    </div>
                    <Link href={`/board/${e.id}`}>
                      <Button variant="ghost">View scoreboard</Button>
                    </Link>
                  </Card>
                ))}
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  tone: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
