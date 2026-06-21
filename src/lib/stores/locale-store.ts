import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { type Locale, defaultLocale, locales, translate } from "@/lib/i18n/config";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  _hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: defaultLocale,
      _hasHydrated: false,
      setHasHydrated: (value) => set({ _hasHydrated: value }),
      setLocale: (locale) => {
        if (locales.includes(locale)) {
          set({ locale });
          if (typeof document !== "undefined") {
            document.documentElement.lang = locale;
          }
        }
      },
    }),
    {
      name: "notik-locale",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ locale: state.locale }),
      onRehydrateStorage: () => (state) => {
        if (state?.locale && typeof document !== "undefined") {
          document.documentElement.lang = state.locale;
        }
        useLocaleStore.setState({ _hasHydrated: true });
      },
    }
  )
);

export function getUntitledTitle(): string {
  const locale = useLocaleStore.getState().locale;
  return translate(locale, "common.untitled");
}

export function useLocaleHydrated(): boolean {
  return useLocaleStore((s) => s._hasHydrated);
}
