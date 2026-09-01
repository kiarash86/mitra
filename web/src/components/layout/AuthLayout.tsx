import type { ReactNode } from "react";
import { useI18n } from "../../i18n";
import { Logo, SunMark } from "../ui/Logo";
import { LanguageSwitcher } from "../ui/LanguageSwitcher";

export function AuthLayout({ children }: { children: ReactNode }) {
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen bg-white">
      <div className="relative hidden w-[42%] shrink-0 flex-col justify-between overflow-hidden bg-ink-950 px-12 py-12 lg:flex">
        <div
          className="pointer-events-none absolute -top-24 -end-24 h-96 w-96 rounded-full bg-saffron-600/20 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-32 -start-16 h-80 w-80 rounded-full bg-saffron-500/10 blur-3xl"
          aria-hidden="true"
        />

        <Logo tone="light" size="md" className="relative" />

        <div className="relative">
          <SunMark className="mb-8 h-16 w-16 opacity-90" />
          <h2 className="max-w-sm text-2xl font-bold leading-relaxed text-white">{t.auth.brandTagline}</h2>
          <ul className="mt-8 space-y-4">
            {t.auth.brandBullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-ink-200">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-saffron-400" />
                {bullet}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-ink-500">
          © {new Date().getFullYear()} {t.common.appName}
        </p>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="absolute end-6 top-6">
          <LanguageSwitcher />
        </div>
        <div className="mb-8 lg:hidden">
          <Logo tone="dark" size="md" />
        </div>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
