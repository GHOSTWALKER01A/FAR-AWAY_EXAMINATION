"use client";

import { Sidebar } from "@/components/shared/sidebar";
import { useGuard } from "@/lib/hooks/use-guard";
import { LoadingBlock } from "@/components/ui/misc";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Any staff role may enter; the sidebar shows role-appropriate links and
  // each page additionally checks permissions where it matters.
  const { ok } = useGuard(["ADMIN", "EXAMINER", "INVIGILATOR"]);

  if (!ok) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingBlock />
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="h-screen flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
