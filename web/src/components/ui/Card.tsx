import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const PADDING_CLASSES = { none: "", sm: "p-4", md: "p-5", lg: "p-7" };

export function Card({ interactive, padding = "md", className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-paper-200 bg-white shadow-soft",
        PADDING_CLASSES[padding],
        interactive &&
          "cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md hover:border-paper-300",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
