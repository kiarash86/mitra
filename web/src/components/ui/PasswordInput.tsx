import { forwardRef, useState } from "react";
import type { InputHTMLAttributes } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { useI18n } from "../../i18n";
import { cn } from "../../lib/cn";
import { FormField } from "./FormField";

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  hint?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { label, error, hint, id, className, ...props },
  ref,
) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  return (
    <FormField label={label} error={error} hint={hint} id={id}>
      {(inputId) => (
        <div className="relative">
          <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-400">
            <Lock className="h-4 w-4" />
          </span>
          <input
            ref={ref}
            id={inputId}
            type={visible ? "text" : "password"}
            className={cn(
              "h-10 w-full rounded-md border bg-white ps-9 pe-9 text-sm text-ink-900 placeholder:text-ink-400 transition-colors duration-150",
              "focus:outline-none focus:ring-2 focus:ring-saffron-500/40 focus:border-saffron-500",
              error ? "border-cinnabar-400" : "border-ink-200",
              className,
            )}
            aria-invalid={!!error}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={t.common.showPassword}
            className="absolute end-3 top-1/2 -translate-y-1/2 text-ink-400 transition-colors hover:text-ink-600"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      )}
    </FormField>
  );
});
