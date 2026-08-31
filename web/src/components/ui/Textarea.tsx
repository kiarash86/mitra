import { forwardRef, useId } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, id, className, rows = 4, ...props },
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
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={cn(
          "w-full resize-none rounded-md border bg-white px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 transition-colors duration-150",
          "focus:outline-none focus:ring-2 focus:ring-saffron-500/40 focus:border-saffron-500",
          error ? "border-cinnabar-400" : "border-ink-200",
          className,
        )}
        aria-invalid={!!error}
        {...props}
      />
      {error ? (
        <p className="mt-1.5 text-xs text-cinnabar-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-400">{hint}</p>
      ) : null}
    </div>
  );
});
