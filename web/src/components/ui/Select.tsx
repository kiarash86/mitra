import { forwardRef, useId } from "react";
import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, id, className, children, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink-700">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={inputId}
          className={cn(
            "h-10 w-full appearance-none rounded-md border bg-white ps-3 pe-9 text-sm text-ink-900 transition-colors duration-150",
            "focus:outline-none focus:ring-2 focus:ring-saffron-500/40 focus:border-saffron-500",
            error ? "border-cinnabar-400" : "border-ink-200",
            className,
          )}
          aria-invalid={!!error}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-cinnabar-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-400">{hint}</p>
      ) : null}
    </div>
  );
});
