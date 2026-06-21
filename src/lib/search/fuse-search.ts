import Fuse, { type IFuseOptions } from "fuse.js";
import type { Note } from "@/types/note";

const fuseOptions: IFuseOptions<Note> = {
  keys: [
    { name: "title", weight: 0.4 },
    { name: "content", weight: 0.35 },
    { name: "tags", weight: 0.25 },
  ],
  threshold: 0.4,
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 2,
};

export function createNoteSearchIndex(notes: Note[]): Fuse<Note> {
  const active = notes.filter((n) => !n.deletedAt);
  return new Fuse(active, fuseOptions);
}

export function searchNotes(fuse: Fuse<Note>, query: string, limit = 20) {
  if (!query.trim()) return [];
  return fuse.search(query, { limit });
}

export function filterNotesByTag(notes: Note[], tag: string): Note[] {
  const normalized = tag.replace(/^#/, "").toLowerCase();
  return notes.filter(
    (n) => !n.deletedAt && n.tags.some((t) => t.toLowerCase() === normalized)
  );
}

export function filterNotesByDate(notes: Note[], dateKey: string): Note[] {
  return notes.filter((n) => {
    if (n.deletedAt) return false;
    const key = new Date(n.noteDate).toISOString().split("T")[0];
    return key === dateKey;
  });
}

export function sortNotesNewestFirst(notes: Note[]): Note[] {
  return [...notes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
