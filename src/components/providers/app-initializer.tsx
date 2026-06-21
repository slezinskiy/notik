"use client";

import { useEffect } from "react";
import { useNotesStore } from "@/lib/stores/notes-store";
import { useUIStore } from "@/lib/stores/ui-store";
import { pullFromServer, startAutoSync, syncWithServer } from "@/lib/sync/sync-manager";

export function AppInitializer() {
  const setNotes = useNotesStore((s) => s.setNotes);
  const setIsLoading = useNotesStore((s) => s.setIsLoading);
  const createNote = useNotesStore((s) => s.createNote);
  const tickTime = useUIStore((s) => s.tickTime);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);

  useEffect(() => {
    setIsLoading(true);
    pullFromServer()
      .then((notes) => {
        if (notes.length > 0) {
          setNotes(notes);
        }
      })
      .finally(() => setIsLoading(false));

    const stopSync = startAutoSync();
    return stopSync;
  }, [setNotes, setIsLoading]);

  useEffect(() => {
    const interval = setInterval(tickTime, 30_000);
    return () => clearInterval(interval);
  }, [tickTime]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "n":
            e.preventDefault();
            createNote();
            break;
          case "s":
            e.preventDefault();
            syncWithServer();
            break;
          case "k":
            e.preventDefault();
            setSearchOpen(true);
            break;
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [createNote, setSearchOpen]);

  return null;
}
