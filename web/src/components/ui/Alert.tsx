import type { ReactNode } from "react";
import { CircleAlert, Info, CircleCheckBig } from "lucide-react";
import { cn } from "../../lib/cn";

type Variant = "error" | "info" | "success";

const ICONS: Record<Variant, typeof CircleAlert> = {
  error: CircleAlert,
  info: Info,
  success: CircleCheckBig,
};

const CLASSES: Record<Variant, string> = {
  error: "bg-cinnabar-50 text-cinnabar-700 border-cinnabar-200",
  info: "bg-progress-50 text-progress-600 border-progress-100",
  success: "bg-moss-50 text-moss-600 border-moss-100",
};

export function Alert({ variant = "error", children }: { variant?: Variant; children: ReactNode }) {
  const Icon = ICONS[variant];
  return (
    <div className={cn("flex items-start gap-2.5 rounded-md border px-3.5 py-2.5 text-sm", CLASSES[variant])}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{children}</p>
    </div>
  );
}
