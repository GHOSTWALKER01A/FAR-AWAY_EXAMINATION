import * as React from "react";
import { cn } from "@/lib/utils";

const base =
  "flex w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm placeholder:text-[var(--color-muted-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]/30 disabled:opacity-50";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(base, "h-10", className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(base, "min-h-24 py-2", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(base, "h-10 cursor-pointer", className)}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium", className)}
      {...props}
    />
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      {label && <Label>{label}</Label>}
      {children}
      {hint && !error && (
        <p className="mt-1 text-xs text-[var(--color-muted)]">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-[var(--color-danger)]">{error}</p>
      )}
    </div>
  );
}
