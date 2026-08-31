import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: ReactNode;
  size?: "sm" | "md";
  variant?: "ghost" | "solid" | "danger-ghost";
}

const SIZE_CLASSES = { sm: "h-8 w-8", md: "h-10 w-10" };
const VARIANT_CLASSES = {
  ghost: "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
  solid: "bg-ink-100 text-ink-700 hover:bg-ink-200",
  "danger-ghost": "text-ink-500 hover:bg-cinnabar-50 hover:text-cinnabar-600",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, size = "md", variant = "ghost", className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
        SIZE_CLASSES[size],
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    >
      {icon}
    </button>
  );
});
