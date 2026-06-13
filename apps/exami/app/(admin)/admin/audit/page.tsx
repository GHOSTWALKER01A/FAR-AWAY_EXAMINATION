"use client";

import { PageHeader, EmptyState } from "@/components/ui/misc";
import { ScrollText } from "lucide-react";

export default function AuditLog() {
  return (
    <div>
      <PageHeader
        title="Audit trail"
        subtitle="Append-only, tamper-evident record of every privileged action."
      />
      <EmptyState
        icon={<ScrollText className="h-8 w-8" />}
        title="Audit log viewer"
        message="Every mutating service already writes audit rows (publish, override, extend-time, grievance-resolve). Bind this screen to the audit read endpoint (extension point) to render a searchable, filterable trail."
      />
    </div>
  );
}
