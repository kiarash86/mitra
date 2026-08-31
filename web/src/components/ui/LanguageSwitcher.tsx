import { Globe, Check } from "lucide-react";
import { useI18n, LOCALES } from "../../i18n";
import { Menu } from "./Menu";
import { IconButton } from "./IconButton";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <Menu
      trigger={
        <IconButton label={t.languageSwitcher.label} icon={<Globe className="h-[18px] w-[18px]" />} />
      }
      items={LOCALES.map((l) => ({
        label: t.languageSwitcher[l],
        icon:
          locale === l ? (
            <Check className="h-4 w-4 text-saffron-600" />
          ) : (
            <span className="inline-block h-4 w-4" />
          ),
        onClick: () => setLocale(l),
      }))}
    />
  );
}
