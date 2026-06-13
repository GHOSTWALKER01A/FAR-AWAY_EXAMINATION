"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/store/auth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Users,
  ShieldCheck,
  ScrollText,
  Settings,
  BookOpen,
  ClipboardCheck,
  MessageSquareWarning,
  Eye,
  LogOut,
  GraduationCap,
} from "lucide-react";
import type { Role } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: Role[];
}

const NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" />, roles: ["ADMIN"] },
  { href: "/admin/exams", label: "All Exams", icon: <FileText className="h-4 w-4" />, roles: ["ADMIN"] },
  { href: "/admin/proctoring", label: "Proctoring", icon: <ShieldCheck className="h-4 w-4" />, roles: ["ADMIN"] },
  { href: "/admin/users", label: "Users", icon: <Users className="h-4 w-4" />, roles: ["ADMIN"] },
  { href: "/admin/audit", label: "Audit Log", icon: <ScrollText className="h-4 w-4" />, roles: ["ADMIN"] },
  { href: "/admin/settings", label: "Settings", icon: <Settings className="h-4 w-4" />, roles: ["ADMIN"] },

  { href: "/examiner", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" />, roles: ["EXAMINER", "ADMIN"] },
  { href: "/examiner/questions", label: "Question Bank", icon: <BookOpen className="h-4 w-4" />, roles: ["EXAMINER", "ADMIN"] },
  { href: "/examiner/grievances", label: "Grievances", icon: <MessageSquareWarning className="h-4 w-4" />, roles: ["EXAMINER", "ADMIN"] },

  { href: "/monitor", label: "Live Monitor", icon: <Eye className="h-4 w-4" />, roles: ["INVIGILATOR", "EXAMINER", "ADMIN"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { claims, signOut } = useAuth();
  const role = claims?.role;

  const items = NAV.filter((n) => role && n.roles.includes(role));

  const isActive = (href: string) =>
    pathname === href ||
    (href !== "/admin" &&
      href !== "/examiner" &&
      href !== "/monitor" &&
      pathname.startsWith(href));

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-brand)] text-white">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold leading-none">ExamFar</p>
          <p className="text-xs text-[var(--color-muted)]">{role}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive(item.href)
                ? "bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
                : "text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]",
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-[var(--color-border)] p-3">
        <div className="mb-2 px-2">
          <p className="truncate text-sm font-medium">{claims?.name ?? claims?.email}</p>
          <p className="truncate text-xs text-[var(--color-muted)]">{claims?.email}</p>
        </div>
        <button
          onClick={() => {
            signOut();
            router.replace("/login");
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-danger)]"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

export { ClipboardCheck };
