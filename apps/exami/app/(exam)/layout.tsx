"use client";

import { useGuard } from "@/lib/hooks/use-guard";
import { LoadingBlock } from "@/components/ui/misc";

export default function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ok } = useGuard(["CANDIDATE"]);

  if (!ok) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingBlock />
      </div>
    );
  }

  return <div className="min-h-screen">{children}</div>;
}
