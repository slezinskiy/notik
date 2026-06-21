"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotesStore } from "@/lib/stores/notes-store";
import { useTranslation } from "@/lib/i18n/use-translation";

export function FloatingActionButton() {
  const createNote = useNotesStore((s) => s.createNote);
  const { t } = useTranslation();

  return (
    <Button
      size="icon"
      className="fixed bottom-6 right-6 z-30 h-14 w-14 rounded-full bg-primary shadow-lg shadow-primary/30 hover:bg-primary/90 md:bottom-8 md:right-8"
      onClick={() => createNote()}
      aria-label={t("fab.createNote")}
    >
      <Plus className="h-6 w-6" />
    </Button>
  );
}
