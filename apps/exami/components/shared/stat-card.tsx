import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon,
  tone = "brand",
  hint,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "brand" | "success" | "warning" | "danger" | "info";
  hint?: string;
}) {
  const toneBg: Record<string, string> = {
    brand: "bg-[var(--color-brand-soft)] text-[var(--color-brand)]",
    success: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
    warning: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
    danger: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
    info: "bg-[var(--color-info-soft)] text-[var(--color-info)]",
  };
  return (
    <Card className="flex items-center gap-4 p-5">
      {icon && (
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl",
            toneBg[tone],
          )}
        >
          {icon}
        </div>
      )}
      <div>
        <p className="text-2xl font-semibold leading-none">{value}</p>
        <p className="mt-1 text-sm text-[var(--color-muted)]">{label}</p>
        {hint && (
          <p className="text-xs text-[var(--color-muted-2)]">{hint}</p>
        )}
      </div>
    </Card>
  );
}
