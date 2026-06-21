import type { Note } from "@/types/note";

export function isValidDate(d: Date): boolean {
  return d instanceof Date && !Number.isNaN(d.getTime());
}

export function parseDate(value: unknown, fallback = new Date()): Date {
  if (value instanceof Date && isValidDate(value)) return value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    if (isValidDate(d)) return d;
  }
  return fallback;
}

export function normalizeNote(raw: Partial<Note> & { id: string }): Note {
  const now = new Date();
  return {
    id: raw.id,
    title: typeof raw.title === "string" ? raw.title : "Untitled",
    content: typeof raw.content === "string" ? raw.content : "",
    tags: Array.isArray(raw.tags) ? raw.tags.filter((t): t is string => typeof t === "string") : [],
    noteDate: parseDate(raw.noteDate, now),
    createdAt: parseDate(raw.createdAt, now),
    updatedAt: parseDate(raw.updatedAt, now),
    deletedAt: raw.deletedAt ? parseDate(raw.deletedAt) : null,
    syncedAt: raw.syncedAt ? parseDate(raw.syncedAt) : null,
    userId: raw.userId,
  };
}

export function normalizeNotes(raw: unknown): Note[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Partial<Note> & { id: string } => {
      return !!item && typeof item === "object" && typeof item.id === "string";
    })
    .map(normalizeNote);
}
