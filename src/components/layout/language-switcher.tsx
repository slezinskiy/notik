"use client";

import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocaleStore } from "@/lib/stores/locale-store";
import { useTranslation } from "@/lib/i18n/use-translation";
import { locales, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  className?: string;
  variant?: "icon" | "full";
}

export function LanguageSwitcher({ className, variant = "icon" }: LanguageSwitcherProps) {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const { t } = useTranslation();

  const cycleLocale = () => {
    const index = locales.indexOf(locale);
    const next = locales[(index + 1) % locales.length] as Locale;
    setLocale(next);
  };

  if (variant === "full") {
    return (
      <div className={cn("flex gap-2", className)}>
        {locales.map((loc) => (
          <Button
            key={loc}
            variant={locale === loc ? "default" : "outline"}
            size="sm"
            onClick={() => setLocale(loc)}
          >
            {t(`language.${loc}` as "language.en")}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleLocale}
      className={className}
      aria-label={t("header.changeLanguage")}
      title={`${t("header.changeLanguage")}: ${t(`language.${locale}` as "language.en")}`}
    >
      <Languages className="h-4 w-4" />
    </Button>
  );
}
