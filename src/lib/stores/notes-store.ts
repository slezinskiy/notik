import { create } from "zustand";
import type { Note, DailyStats } from "@/types/note";
import {
  sortNotesNewestFirst,
  filterNotesByDate,
  filterNotesByTag,
} from "@/lib/search/fuse-search";
import { countWords, toDateKey, generateId } from "@/lib/utils";
import { queueNoteSync } from "@/lib/sync/sync-manager";

interface NotesState {
  notes: Note[];
  selectedNoteId: string | null;
  selectedDate: Date;
  activeTagFilter: string | null;
  searchQuery: string;
  showTrash: boolean;
  isLoading: boolean;
  isSaving: boolean;

  setNotes: (notes: Note[]) => void;
  setSelectedDate: (date: Date) => void;
  setSelectedNoteId: (id: string | null) => void;
  setActiveTagFilter: (tag: string | null) => void;
  setSearchQuery: (query: string) => void;
  setShowTrash: (show: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setIsSaving: (saving: boolean) => void;

  getFilteredNotes: () => Note[];
  getSelectedNote: () => Note | null;
  getNotesForCalendar: () => Map<string, number>;
  getDailyStats: () => DailyStats;
  getAllTags: () => { name: string; count: number }[];
  getTrashNotes: () => Note[];

  createNote: (noteDate?: Date) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  restoreNote: (id: string) => void;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  selectedNoteId: null,
  selectedDate: new Date(),
  activeTagFilter: null,
  searchQuery: "",
  showTrash: false,
  isLoading: false,
  isSaving: false,

  setNotes: (notes) => set({ notes }),
  setSelectedDate: (date) => set({ selectedDate: date, activeTagFilter: null }),
  setSelectedNoteId: (id) => set({ selectedNoteId: id }),
  setActiveTagFilter: (tag) => set({ activeTagFilter: tag }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setShowTrash: (show) => set({ showTrash: show }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsSaving: (saving) => set({ isSaving: saving }),

  getFilteredNotes: () => {
    const { notes, selectedDate, activeTagFilter, showTrash, searchQuery } = get();
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
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return sortNotesNewestFirst(filtered);
  },

  getSelectedNote: () => {
    const { notes, selectedNoteId } = get();
    return notes.find((n) => n.id === selectedNoteId) ?? null;
  },

  getNotesForCalendar: () => {
    const { notes } = get();
    const map = new Map<string, number>();
    for (const note of notes.filter((n) => !n.deletedAt)) {
      const key = toDateKey(note.noteDate);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  },

  getDailyStats: () => {
    const filtered = get().getFilteredNotes();
    const tags = new Set<string>();
    let wordCount = 0;

    for (const note of filtered) {
      note.tags.forEach((t) => tags.add(t));
      wordCount += countWords(note.content);
    }

    return {
      noteCount: filtered.length,
      tagCount: tags.size,
      wordCount,
    };
  },

  getAllTags: () => {
    const { notes } = get();
    const tagMap = new Map<string, number>();
    for (const note of notes.filter((n) => !n.deletedAt)) {
      for (const tag of note.tags) {
        tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1);
      }
    }
    return [...tagMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  },

  getTrashNotes: () => {
    return sortNotesNewestFirst(get().notes.filter((n) => n.deletedAt));
  },

  createNote: (noteDate) => {
    const date = noteDate ?? get().selectedDate;
    const note: Note = {
      id: generateId(),
      title: "Untitled",
      content: "",
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      noteDate: date,
    };

    set((state) => ({
      notes: [note, ...state.notes],
      selectedNoteId: note.id,
    }));

    queueNoteSync(note, "create").catch(console.error);
    return note;
  },

  updateNote: (id, updates) => {
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: new Date() } : n
      ),
    }));

    const note = get().notes.find((n) => n.id === id);
    if (note) {
      queueNoteSync({ ...note, ...updates, updatedAt: new Date() }, "update").catch(
        console.error
      );
    }
  },

  deleteNote: (id) => {
    const deletedAt = new Date();
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, deletedAt, updatedAt: deletedAt } : n
      ),
      selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId,
    }));

    const note = get().notes.find((n) => n.id === id);
    if (note) {
      queueNoteSync({ ...note, deletedAt }, "delete").catch(console.error);
    }
  },

  restoreNote: (id) => {
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, deletedAt: null, updatedAt: new Date() } : n
      ),
    }));

    const note = get().notes.find((n) => n.id === id);
    if (note) {
      queueNoteSync({ ...note, deletedAt: null }, "restore").catch(console.error);
    }
  },
}));
