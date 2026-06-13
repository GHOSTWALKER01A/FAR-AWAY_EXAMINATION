import { GraduationCap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[var(--color-brand-soft)] via-[var(--color-bg)] to-[var(--color-bg)] p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-brand)] text-white">
            <GraduationCap className="h-6 w-6" />
          </div>
          <span className="text-xl font-semibold">ExamFar</span>
        </div>
        {children}
        <p className="mt-6 text-center text-xs text-[var(--color-muted)]">
          Secure · Fair · Intelligent examinations
        </p>
      </div>
    </div>
  );
}
