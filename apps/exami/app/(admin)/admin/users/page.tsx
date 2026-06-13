"use client";

import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Users } from "lucide-react";

export default function AdminUsers() {
  return (
    <div>
      <PageHeader
        title="Users & roles"
        subtitle="Invite staff and manage role assignments."
      />
      <EmptyState
        icon={<Users className="h-8 w-8" />}
        title="User administration"
        message="This screen binds to the user-management endpoints (extension point). Staff are currently seeded via the backend seed.ts. Wire up GET/POST /users here to invite examiners and invigilators."
      />
    </div>
  );
}
