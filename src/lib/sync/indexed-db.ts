import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Note, SyncOperation } from "@/types/note";

interface NotikDB extends DBSchema {
  notes: {
    key: string;
    value: Note & { pendingSync?: boolean };
    indexes: { "by-date": string; "by-updated": string };
  };
  syncQueue: {
    key: string;
    value: SyncOperation;
    indexes: { "by-created": string };
  };
  meta: {
    key: string;
    value: { key: string; value: string };
  };
}

const DB_NAME = "notik-offline";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<NotikDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<NotikDB>> {
  if (!dbPromise) {
    dbPromise = openDB<NotikDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const notesStore = db.createObjectStore("notes", { keyPath: "id" });
        notesStore.createIndex("by-date", "noteDate");
        notesStore.createIndex("by-updated", "updatedAt");

        const syncStore = db.createObjectStore("syncQueue", { keyPath: "id" });
        syncStore.createIndex("by-created", "createdAt");

        db.createObjectStore("meta", { keyPath: "key" });
      },
    });
  }
  return dbPromise;
}

export async function saveNoteLocally(note: Note & { pendingSync?: boolean }): Promise<void> {
  const db = await getDB();
  await db.put("notes", note);
}

export async function getNoteLocally(id: string): Promise<Note | undefined> {
  const db = await getDB();
  return db.get("notes", id);
}

export async function getAllNotesLocally(): Promise<Note[]> {
  const db = await getDB();
  return db.getAll("notes");
}

export async function deleteNoteLocally(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("notes", id);
}

export async function getNotesByDateLocally(dateKey: string): Promise<Note[]> {
  const all = await getAllNotesLocally();
  return all.filter((n) => {
    const d = new Date(n.noteDate);
    const key = d.toISOString().split("T")[0];
    return key === dateKey && !n.deletedAt;
  });
}

export async function enqueueSyncOperation(op: SyncOperation): Promise<void> {
  const db = await getDB();
  await db.put("syncQueue", op);
}

export async function getPendingSyncOperations(): Promise<SyncOperation[]> {
  const db = await getDB();
  const ops = await db.getAll("syncQueue");
  return ops.filter((o) => !o.processedAt).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export async function markSyncOperationProcessed(id: string): Promise<void> {
  const db = await getDB();
  const op = await db.get("syncQueue", id);
  if (op) {
    op.processedAt = new Date();
    await db.put("syncQueue", op);
  }
}

export async function clearProcessedSyncOperations(): Promise<void> {
  const db = await getDB();
  const ops = await db.getAll("syncQueue");
  const tx = db.transaction("syncQueue", "readwrite");
  for (const op of ops) {
    if (op.processedAt) {
      await tx.store.delete(op.id);
    }
  }
  await tx.done;
}

export async function setMeta(key: string, value: string): Promise<void> {
  const db = await getDB();
  await db.put("meta", { key, value });
}

export async function getMeta(key: string): Promise<string | undefined> {
  const db = await getDB();
  const entry = await db.get("meta", key);
  return entry?.value;
}

export async function bulkSaveNotesLocally(notes: Note[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("notes", "readwrite");
  for (const note of notes) {
    await tx.store.put(note);
  }
  await tx.done;
}
