import type { ReactNode } from "react";
import { Card } from "./Card";
import { cn } from "../../lib/cn";

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  tone?: "saffron" | "progress" | "moss" | "cinnabar" | "ember";
}

const TONE_CLASSES = {
  saffron: "bg-saffron-100 text-saffron-700",
  progress: "bg-progress-100 text-progress-600",
  moss: "bg-moss-100 text-moss-600",
  cinnabar: "bg-cinnabar-100 text-cinnabar-600",
  ember: "bg-ember-100 text-ember-600",
};

export function StatCard({ label, value, icon, tone = "saffron" }: StatCardProps) {
  return (
    <Card className="flex items-center gap-4">
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
          TONE_CLASSES[tone],
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-ink-900">{value}</p>
        <p className="truncate text-sm text-ink-500">{label}</p>
      </div>
    </Card>
  );
}
