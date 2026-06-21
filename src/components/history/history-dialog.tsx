"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/lib/stores/ui-store";
import { useNotesStore } from "@/lib/stores/notes-store";
import { useSelectedNote } from "@/lib/hooks/use-notes-selectors";
import type { NoteRevision } from "@/types/note";

export function HistoryDialog() {
  const historyOpen = useUIStore((s) => s.historyOpen);
  const setHistoryOpen = useUIStore((s) => s.setHistoryOpen);
  const selectedNote = useSelectedNote();
  const updateNote = useNotesStore((s) => s.updateNote);
  const [revisions, setRevisions] = useState<NoteRevision[]>([]);
  const [compareId, setCompareId] = useState<string | null>(null);

  useEffect(() => {
    if (!historyOpen || !selectedNote) return;

    fetch(`/api/history/${selectedNote.id}`)
      .then((r) => r.json())
      .then(setRevisions)
      .catch(console.error);
  }, [historyOpen, selectedNote]);

  const compareRevision = revisions.find((r) => r.id === compareId);

  const handleRestore = async (revisionId: string) => {
    if (!selectedNote) return;

    const res = await fetch(`/api/history/${selectedNote.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revisionId }),
    });

    if (res.ok) {
      const note = await res.json();
      updateNote(selectedNote.id, note);
      setHistoryOpen(false);
    }
  };

  return (
    <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
        </DialogHeader>

        {!selectedNote ? (
          <p className="text-sm text-muted-foreground">Select a note to view history</p>
        ) : (
          <div className="grid max-h-[400px] gap-4 overflow-auto md:grid-cols-2">
            <div className="space-y-2">
              {revisions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No revisions yet</p>
              ) : (
                revisions.map((rev) => (
                  <div
                    key={rev.id}
                    className="rounded-lg border p-3"
                  >
                    <p className="text-sm font-medium">{rev.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(rev.createdAt), "dd MMM yyyy HH:mm")}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setCompareId(rev.id)}>
                        Compare
                      </Button>
                      <Button size="sm" onClick={() => handleRestore(rev.id)}>
                        Restore
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {compareRevision && (
              <div className="rounded-lg border p-3">
                <h4 className="mb-2 text-sm font-medium">Comparison</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Current title</p>
                    <p>{selectedNote.title}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Revision title</p>
                    <p>{compareRevision.title}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Revision content</p>
                    <p className="max-h-[150px] overflow-auto whitespace-pre-wrap text-xs">
                      {compareRevision.content.replace(/<[^>]*>/g, "").slice(0, 500)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
