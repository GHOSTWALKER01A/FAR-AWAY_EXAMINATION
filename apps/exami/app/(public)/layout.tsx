import { GraduationCap } from "lucide-react";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand)] text-white">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-semibold">ExamFar</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
