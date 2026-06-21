import { uk, enUS } from "date-fns/locale";
import type { Locale } from "@/lib/i18n/config";

const dateLocales = {
  uk,
  en: enUS,
} as const;

export function getDateLocale(locale: Locale) {
  return dateLocales[locale];
}
