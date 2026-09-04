import { useId } from "react";
import type { ReactNode } from "react";

interface FormFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  id?: string;
  /** Render-prop so each control keeps its own markup; only gets the resolved input id. */
  children: (inputId: string) => ReactNode;
}

/**
 * Shared label + error/hint chrome for form controls. Input, Textarea,
 * Select and PasswordInput each render their own control via the
 * children render-prop, so this is the one place that owns the
 * label-association (useId), and the error-vs-hint display rule.
 */
export function FormField({ label, error, hint, id, children }: FormFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink-700">
          {label}
        </label>
      )}
      {children(inputId)}
      {error ? (
        <p className="mt-1.5 text-xs text-cinnabar-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-400">{hint}</p>
      ) : null}
    </div>
  );
}
