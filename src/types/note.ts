export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  noteDate: Date;
  deletedAt?: Date | null;
  syncedAt?: Date | null;
  userId?: string;
}

export interface NoteRevision {
  id: string;
  noteId: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  count?: number;
}

export interface CalendarDay {
  date: string;
  noteCount: number;
  tags: string[];
}

export interface DailyStats {
  noteCount: number;
  tagCount: number;
  wordCount: number;
}

export interface SyncOperation {
  id: string;
  entityType: "note" | "tag";
  entityId: string;
  operation: "create" | "update" | "delete" | "restore";
  payload: Record<string, unknown>;
  createdAt: Date;
  processedAt?: Date | null;
}

export type ExportScope = "note" | "day" | "month" | "all";

export interface SearchResult {
  item: Note;
  score?: number;
  matches?: readonly FuseResultMatch[];
}

interface FuseResultMatch {
  key?: string;
  value?: string;
  indices?: readonly [number, number][];
}
