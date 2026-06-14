import Link from "next/link";
import { GraduationCap, ShieldCheck, Mail } from "lucide-react";
import { PublicNav } from "@/components/public/public-nav";

const FOOTER_COLS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Platform",
    links: [
      { label: "Features", href: "/features" },
      { label: "How it works", href: "/how-it-works" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Get started",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Create account", href: "/login" },
      { label: "Contact us", href: "/contact" },
    ],
  },
  {
    title: "Trust & safety",
    links: [
      { label: "Proctoring", href: "/features#proctoring" },
      { label: "Data security", href: "/features#security" },
      { label: "Support", href: "/contact" },
    ],
  },
];

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <PublicNav />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        {children}
      </main>

      <footer className="border-t border-border bg-surface-2">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
            {/* Brand blurb */}
            <div>
              <Link href="/home" className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <span className="text-lg font-bold tracking-tight text-brand">
                  Exami
                </span>
              </Link>
              <p className="mt-3 max-w-xs text-sm text-muted">
                A secure, fair and intelligent online examination platform —
                adaptive testing, AI-assisted grading and live proctoring in one
                place.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
                <ShieldCheck className="h-3.5 w-3.5 text-success" />
                Encrypted &amp; proctored end-to-end
              </div>
            </div>

            {/* Link columns */}
            {FOOTER_COLS.map((col) => (
              <div key={col.title}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                  {col.title}
                </p>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-sm text-muted transition-colors hover:text-fg"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted sm:flex-row">
            <p>© {new Date().getFullYear()} Exami · Secure · Fair · Transparent</p>
            <a
              href="mailto:support@exami.edu"
              className="flex items-center gap-1.5 transition-colors hover:text-fg"
            >
              <Mail className="h-3.5 w-3.5" />
              support@exami.edu
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
