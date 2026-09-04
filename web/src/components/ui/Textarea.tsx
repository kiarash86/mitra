import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/cn";
import { FormField } from "./FormField";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, id, className, rows = 4, ...props },
  ref,
) {
  return (
    <FormField label={label} error={error} hint={hint} id={id}>
      {(inputId) => (
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
      )}
    </FormField>
  );
});
