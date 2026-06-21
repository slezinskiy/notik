"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { TipTapEditor } from "@/components/editor/tiptap-editor";
import { FloatingActionButton } from "@/components/layout/fab";
import { SearchDialog } from "@/components/search/search-dialog";
import { ExportDialog } from "@/components/export/export-dialog";
import { HistoryDialog } from "@/components/history/history-dialog";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { AppInitializer } from "@/components/providers/app-initializer";
import { useNotesStore } from "@/lib/stores/notes-store";
import { Loader2 } from "lucide-react";

export function AppShell() {
  const [mounted, setMounted] = useState(false);
  const isLoading = useNotesStore((s) => s.isLoading);
  const isSaving = useNotesStore((s) => s.isSaving);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppInitializer />
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <TipTapEditor />
        )}
        {isSaving && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
            Saving...
          </div>
        )}
      </main>
      <FloatingActionButton />
      <SearchDialog />
      <ExportDialog />
      <HistoryDialog />
      <InstallPrompt />
    </div>
  );
}
