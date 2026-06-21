import { useMemo } from "react";
import type { Note, DailyStats } from "@/types/note";
import { useNotesStore } from "@/lib/stores/notes-store";
import {
  sortNotesNewestFirst,
  filterNotesByDate,
  filterNotesByTag,
} from "@/lib/search/fuse-search";
import { countWords, toDateKey } from "@/lib/utils";

export function useFilteredNotes(): Note[] {
  const notes = useNotesStore((s) => s.notes);
  const selectedDate = useNotesStore((s) => s.selectedDate);
  const activeTagFilter = useNotesStore((s) => s.activeTagFilter);
  const showTrash = useNotesStore((s) => s.showTrash);
  const searchQuery = useNotesStore((s) => s.searchQuery);

  return useMemo(() => {
    let filtered = showTrash
      ? notes.filter((n) => n.deletedAt)
      : notes.filter((n) => !n.deletedAt);

    if (!showTrash) {
      filtered = filterNotesByDate(filtered, toDateKey(selectedDate));
    }

    if (activeTagFilter) {
      filtered = filterNotesByTag(filtered, activeTagFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          (n.title ?? "").toLowerCase().includes(q) ||
          (n.content ?? "").toLowerCase().includes(q) ||
          (n.tags ?? []).some((t) => t.toLowerCase().includes(q))
      );
    }

    return sortNotesNewestFirst(filtered);
  }, [notes, selectedDate, activeTagFilter, showTrash, searchQuery]);
}

export function useSelectedNote(): Note | null {
  const notes = useNotesStore((s) => s.notes);
  const selectedNoteId = useNotesStore((s) => s.selectedNoteId);

  return useMemo(
    () => notes.find((n) => n.id === selectedNoteId) ?? null,
    [notes, selectedNoteId]
  );
}

export function useCalendarNoteCounts(): Map<string, number> {
  const notes = useNotesStore((s) => s.notes);

  return useMemo(() => {
    const map = new Map<string, number>();
    for (const note of notes.filter((n) => !n.deletedAt)) {
      const key = toDateKey(note.noteDate);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [notes]);
}

export function useDailyStats(): DailyStats {
  const filtered = useFilteredNotes();

  return useMemo(() => {
    const tags = new Set<string>();
    let wordCount = 0;

    for (const note of filtered) {
      (note.tags ?? []).forEach((t) => tags.add(t));
      wordCount += countWords(note.content ?? "");
    }

    return {
      noteCount: filtered.length,
      tagCount: tags.size,
      wordCount,
    };
  }, [filtered]);
}
