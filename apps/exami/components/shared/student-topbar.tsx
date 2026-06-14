"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/store/auth";
import { Button } from "@/components/ui/button";
import { GraduationCap, LogOut } from "lucide-react";

export function StudentTopbar() {
  const router = useRouter();
  const { claims, signOut } = useAuth();
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/exams" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-brand)] text-white shadow-sm animate-logo-float">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-[var(--color-brand)]">Exami</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--color-muted)]">
            {claims?.name ?? claims?.email}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              signOut();
              router.replace("/login");
            }}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
