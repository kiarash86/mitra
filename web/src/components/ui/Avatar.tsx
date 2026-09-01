import { cn } from "../../lib/cn";

interface AvatarProps {
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  ring?: boolean;
}

const SIZE_CLASSES = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

const PALETTE = [
  "bg-saffron-100 text-saffron-700",
  "bg-progress-100 text-progress-600",
  "bg-plum-100 text-plum-600",
  "bg-moss-100 text-moss-600",
  "bg-ember-100 text-ember-600",
  "bg-cinnabar-100 text-cinnabar-600",
];

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function toneOf(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function Avatar({ name, size = "md", className, ring }: AvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        SIZE_CLASSES[size],
        toneOf(name || "?"),
        ring && "ring-2 ring-white",
        className,
      )}
      title={name}
    >
      {initialsOf(name || "?")}
    </span>
  );
}

export function AvatarGroup({ names, max = 4 }: { names: string[]; max?: number }) {
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((name, i) => (
        <Avatar key={`${name}-${i}`} name={name} size="sm" ring />
      ))}
      {extra > 0 && (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-100 text-xs font-semibold text-ink-500 ring-2 ring-white">
          +{extra}
        </span>
      )}
    </div>
  );
}
