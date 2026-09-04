import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 rounded-md disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-saffron-600 text-white hover:bg-saffron-700 shadow-soft",
  secondary: "bg-white text-ink-800 border border-ink-200 hover:bg-paper-100",
  ghost: "text-ink-700 hover:bg-ink-100",
  danger: "bg-cinnabar-600 text-white hover:bg-cinnabar-700 shadow-soft",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, icon, disabled, className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(BUTTON_BASE, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className)}
      {...props}
    >
      {loading ? (
        <Spinner size="sm" tone={variant === "primary" || variant === "danger" ? "light" : "dark"} />
      ) : (
        icon
      )}
      {children}
    </button>
  );
});
