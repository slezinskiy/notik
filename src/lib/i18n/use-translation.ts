import { useCallback, useEffect } from "react";
import { useLocaleStore } from "@/lib/stores/locale-store";
import { translate, type TranslationKey } from "@/lib/i18n/config";

export function useTranslation() {
  const locale = useLocaleStore((s) => s.locale);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      translate(locale, key, params),
    [locale]
  );

  return { t, locale };
}

export function useLocaleEffect() {
  const locale = useLocaleStore((s) => s.locale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
}
