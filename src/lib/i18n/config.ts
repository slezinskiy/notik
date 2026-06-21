import en from "@/locales/en.json";
import uk from "@/locales/uk.json";

export const locales = ["en", "uk"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "uk";

export const localeNames: Record<Locale, string> = {
  en: "English",
  uk: "Українська",
};

const messages: Record<Locale, typeof en> = { en, uk };

export function getMessages(locale: Locale) {
  if (!locale || !(locale in messages)) return messages[defaultLocale];
  return messages[locale];
}

export function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return defaultLocale;

  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith("uk")) return "uk";
  if (browserLang.startsWith("en")) return "en";

  return defaultLocale;
}

type NestedKeyOf<T, Prefix extends string = ""> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? NestedKeyOf<T[K], Prefix extends "" ? K : `${Prefix}.${K}`>
        : Prefix extends ""
          ? K
          : `${Prefix}.${K}`;
    }[keyof T & string]
  : never;

export type TranslationKey = NestedKeyOf<typeof en>;

export function translate(
  locale: Locale,
  key: TranslationKey,
  params?: Record<string, string | number>
): string {
  const keys = key.split(".");
  let value: unknown = getMessages(locale);

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      value = undefined;
      break;
    }
  }

  if (typeof value !== "string") {
    return key;
  }

  if (!params) return value;

  return Object.entries(params).reduce(
    (str, [param, val]) => str.replace(`{${param}}`, String(val)),
    value
  );
}
