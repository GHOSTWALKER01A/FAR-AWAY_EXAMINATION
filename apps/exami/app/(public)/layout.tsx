import { GraduationCap } from "lucide-react";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand animate-logo-float">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold tracking-tight text-[var(--color-brand)]">Exami</span>
          </div>
          <p className="hidden text-xs text-muted sm:block">
            Secure online examination platform
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>

      <footer className="mt-16 border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-6 text-center text-xs text-muted">
          <p>© {new Date().getFullYear()} Exami · Secure · Fair · Transparent</p>
        </div>
      </footer>
    </div>
  );
}
