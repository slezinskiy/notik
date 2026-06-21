"use client";

import { WifiOff } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/use-translation";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

export default function OfflinePage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher variant="full" />
      </div>
      <WifiOff className="mb-4 h-16 w-16 text-muted-foreground" />
      <h1 className="text-2xl font-bold">{t("offline.title")}</h1>
      <p className="mt-2 max-w-md text-muted-foreground">{t("offline.description")}</p>
      <Link
        href="/app"
        className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        {t("offline.goToNotes")}
      </Link>
    </div>
  );
}
