import { cn } from "../../lib/cn";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  tone?: "light" | "dark";
  className?: string;
}

const SIZE_CLASSES = { sm: "h-4 w-4 border-2", md: "h-6 w-6 border-2", lg: "h-9 w-9 border-[3px]" };

export function Spinner({ size = "md", tone = "dark", className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="loading"
      className={cn(
        "inline-block animate-spin rounded-full",
        SIZE_CLASSES[size],
        tone === "light"
          ? "border-white/30 border-t-white"
          : "border-ink-200 border-t-saffron-600",
        className,
      )}
    />
  );
}
