import { ArrowRight, ArrowLeft } from "lucide-react";
import { useI18n } from "../../i18n";

/** Points toward "back/previous" in the current reading direction. */
export function BackIcon({ className }: { className?: string }) {
  const { dir } = useI18n();
  const Icon = dir === "rtl" ? ArrowRight : ArrowLeft;
  return <Icon className={className} />;
}
