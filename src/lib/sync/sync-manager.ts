import type { Note, SyncOperation } from "@/types/note";
import {
  saveNoteLocally,
  enqueueSyncOperation,
  getPendingSyncOperations,
  markSyncOperationProcessed,
  bulkSaveNotesLocally,
  getMeta,
  setMeta,
} from "@/lib/sync/indexed-db";
import { generateId } from "@/lib/utils";

export async function queueNoteSync(
  note: Note,
  operation: SyncOperation["operation"]
): Promise<void> {
  const op: SyncOperation = {
    id: generateId(),
    entityType: "note",
    entityId: note.id,
    operation,
    payload: { ...note },
    createdAt: new Date(),
  };

  await saveNoteLocally({ ...note, pendingSync: true });
  await enqueueSyncOperation(op);
}

export async function syncWithServer(): Promise<{ synced: number; conflicts: number }> {
  if (!navigator.onLine) return { synced: 0, conflicts: 0 };

  const pending = await getPendingSyncOperations();
  if (pending.length === 0) return { synced: 0, conflicts: 0 };

  const lastSyncAt = await getMeta("lastSyncAt");

  try {
    const response = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operations: pending.map((op) => ({
          ...op,
          createdAt: op.createdAt.toISOString(),
        })),
        lastSyncAt,
      }),
    });

    if (!response.ok) throw new Error("Sync failed");

    const result = await response.json();
    let synced = 0;

    for (const op of pending) {
      await markSyncOperationProcessed(op.id);
      synced++;
    }

    if (result.notes?.length) {
      await bulkSaveNotesLocally(
        result.notes.map((n: Note) => ({
          ...n,
          createdAt: new Date(n.createdAt),
          updatedAt: new Date(n.updatedAt),
          noteDate: new Date(n.noteDate),
        }))
      );
    }

    await setMeta("lastSyncAt", new Date().toISOString());
    return { synced, conflicts: result.conflicts ?? 0 };
  } catch {
    return { synced: 0, conflicts: 0 };
  }
}

export async function pullFromServer(): Promise<Note[]> {
  if (!navigator.onLine) return [];

  const response = await fetch("/api/notes");
  if (!response.ok) return [];

  const notes: Note[] = await response.json();
  const parsed = notes.map((n) => ({
    ...n,
    createdAt: new Date(n.createdAt),
    updatedAt: new Date(n.updatedAt),
    noteDate: new Date(n.noteDate),
    deletedAt: n.deletedAt ? new Date(n.deletedAt) : null,
  }));

  await bulkSaveNotesLocally(parsed);
  return parsed;
}

export function startAutoSync(intervalMs = 30_000): () => void {
  const interval = setInterval(() => {
    if (navigator.onLine) {
      syncWithServer().catch(console.error);
    }
  }, intervalMs);

  const handleOnline = () => syncWithServer().catch(console.error);
  window.addEventListener("online", handleOnline);

  return () => {
    clearInterval(interval);
    window.removeEventListener("online", handleOnline);
  };
}
