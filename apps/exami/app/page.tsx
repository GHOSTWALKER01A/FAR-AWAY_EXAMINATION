"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, HOME_BY_ROLE } from "@/lib/store/auth";
import { Spinner } from "@/components/ui/misc";

export default function Landing() {
  const router = useRouter();
  const { claims, ready, bootstrap } = useAuth();

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (!ready) return;
    if (claims) router.replace(HOME_BY_ROLE[claims.role] ?? "/login");
    else router.replace("/login");
  }, [ready, claims, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-[var(--color-muted)]">
        <Spinner className="h-7 w-7" />
        <p className="text-sm">Loading ExamFar…</p>
      </div>
    </div>
  );
}
