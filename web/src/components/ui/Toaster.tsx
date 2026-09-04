import { useEffect } from "react";
import { CircleAlert, Info, CircleCheckBig, X } from "lucide-react";
import { useI18n } from "../../i18n";
import { useToastStore } from "../../stores/toast";
import type { ToastVariant } from "../../stores/toast";
import { cn } from "../../lib/cn";

const ICONS: Record<ToastVariant, typeof CircleAlert> = {
  error: CircleAlert,
  info: Info,
  success: CircleCheckBig,
};

const CLASSES: Record<ToastVariant, string> = {
  error: "bg-cinnabar-50 text-cinnabar-700 border-cinnabar-200",
  info: "bg-progress-50 text-progress-600 border-progress-100",
  success: "bg-moss-50 text-moss-600 border-moss-100",
};

const AUTO_DISMISS_MS = 5000;

function ToastItem({ id, variant, message }: { id: string; variant: ToastVariant; message: string }) {
  const { t } = useI18n();
  const dismiss = useToastStore((s) => s.dismiss);

  useEffect(() => {
    const timer = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [id, dismiss]);

  const Icon = ICONS[variant];
  return (
    <div
      role="status"
      className={cn(
        "animate-fade-up flex w-80 max-w-[calc(100vw-2rem)] items-start gap-2.5 rounded-md border px-3.5 py-2.5 text-sm shadow-lg",
        CLASSES[variant]
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="flex-1">{message}</p>
      <button
        type="button"
        onClick={() => dismiss(id)}
        aria-label={t.common.close}
        className="shrink-0 text-current opacity-60 transition-opacity hover:opacity-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/** Mounted once at the app root (see App.tsx) — renders every active toast. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  if (toasts.length === 0) return null;

  return (
    <div className="fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:end-4 sm:items-end">
      {toasts.map((item) => (
        <ToastItem key={item.id} id={item.id} variant={item.variant} message={item.message} />
      ))}
    </div>
  );
}
