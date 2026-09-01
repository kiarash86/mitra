import { useI18n } from "../../i18n";
import { cn } from "../../lib/cn";

export function SunMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <g stroke="currentColor" strokeWidth="5" strokeLinecap="round" className="text-saffron-500">
        <line x1="24" y1="11" x2="24" y2="3" />
        <line x1="33.19" y1="14.81" x2="38.85" y2="9.15" />
        <line x1="37" y1="24" x2="45" y2="24" />
        <line x1="33.19" y1="33.19" x2="38.85" y2="38.85" />
        <line x1="24" y1="37" x2="24" y2="45" />
        <line x1="14.81" y1="33.19" x2="9.15" y2="38.85" />
        <line x1="11" y1="24" x2="3" y2="24" />
        <line x1="14.81" y1="14.81" x2="9.15" y2="9.15" />
      </g>
      <circle cx="24" cy="24" r="10.5" fill="currentColor" className="text-saffron-400" />
    </svg>
  );
}

interface LogoProps {
  tone?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MARK = { sm: "h-6 w-6", md: "h-8 w-8", lg: "h-11 w-11" };
const SIZE_TEXT = { sm: "text-base", md: "text-xl", lg: "text-2xl" };

export function Logo({ tone = "dark", size = "md", className }: LogoProps) {
  const { locale } = useI18n();
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <SunMark className={SIZE_MARK[size]} />
      <span
        className={cn(
          "font-bold tracking-tight",
          SIZE_TEXT[size],
          tone === "light" ? "text-paper-50" : "text-ink-900",
        )}
      >
        {locale === "fa" ? "میترا" : "Mitra"}
      </span>
    </div>
  );
}
