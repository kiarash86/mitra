import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";
import { FormField } from "./FormField";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, icon, id, className, ...props },
  ref,
) {
  return (
    <FormField label={label} error={error} hint={hint} id={id}>
      {(inputId) => (
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-400">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "h-10 w-full rounded-md border bg-white px-3 text-sm text-ink-900 placeholder:text-ink-400 transition-colors duration-150",
              "focus:outline-none focus:ring-2 focus:ring-saffron-500/40 focus:border-saffron-500",
              "disabled:cursor-not-allowed disabled:border-paper-200 disabled:bg-paper-100 disabled:text-ink-400",
              icon ? "ps-9" : undefined,
              error ? "border-cinnabar-400" : "border-ink-200",
              className,
            )}
            aria-invalid={!!error}
            {...props}
          />
        </div>
      )}
    </FormField>
  );
});
