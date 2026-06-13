"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, HOME_BY_ROLE } from "@/lib/store/auth";
import type { Role } from "@/lib/types";

/**
 * Client-side route guard. Redirects unauthenticated users to /login and
 * users whose role is not in `allow` to their own home dashboard.
 * Returns { ok } once the check passes so layouts can gate rendering.
 */
export function useGuard(allow: Role[]) {
  const router = useRouter();
  const { claims, ready, bootstrap } = useAuth();

  useEffect(() => {
    if (!ready) void bootstrap();
  }, [ready, bootstrap]);

  useEffect(() => {
    if (!ready) return;
    if (!claims) {
      router.replace("/login");
      return;
    }
    if (!allow.includes(claims.role)) {
      router.replace(HOME_BY_ROLE[claims.role] ?? "/login");
    }
  }, [ready, claims, allow, router]);

  const ok = ready && !!claims && allow.includes(claims.role);
  return { ok, claims, ready };
}
