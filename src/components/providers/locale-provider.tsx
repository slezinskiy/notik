"use client";

import { useEffect } from "react";
import { useLocaleStore } from "@/lib/stores/locale-store";
import { detectBrowserLocale } from "@/lib/i18n/config";
import { useLocaleEffect } from "@/lib/i18n/use-translation";

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  useLocaleEffect();

  useEffect(() => {
    void useLocaleStore.persist.rehydrate();

    const stored = localStorage.getItem("notik-locale");
    if (!stored) {
      useLocaleStore.getState().setLocale(detectBrowserLocale());
    }

    useLocaleStore.setState({ _hasHydrated: true });
  }, []);

  return <>{children}</>;
}
