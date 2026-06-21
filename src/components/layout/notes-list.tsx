"use client";

import { format } from "date-fns";
import { FileText, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useNotesStore } from "@/lib/stores/notes-store";
import { useFilteredNotes } from "@/lib/hooks/use-notes-selectors";

export function NotesList() {
  const notes = useFilteredNotes();
  const selectedNoteId = useNotesStore((s) => s.selectedNoteId);
  const setSelectedNoteId = useNotesStore((s) => s.setSelectedNoteId);
  const searchQuery = useNotesStore((s) => s.searchQuery);
  const setSearchQuery = useNotesStore((s) => s.setSearchQuery);
  const restoreNote = useNotesStore((s) => s.restoreNote);
  const setActiveTagFilter = useNotesStore((s) => s.setActiveTagFilter);
  const showTrash = useNotesStore((s) => s.showTrash);
  const setShowTrash = useNotesStore((s) => s.setShowTrash);
  const activeTagFilter = useNotesStore((s) => s.activeTagFilter);

  return (
    <div className="flex flex-1 flex-col overflow-hidden border-t">
      <div className="space-y-2 p-3">
        <Input
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search notes"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTrash(false)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors",
              !showTrash ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
            )}
          >
            <FileText className="h-3.5 w-3.5" />
            Notes
          </button>
          <button
            type="button"
            onClick={() => setShowTrash(true)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors",
              showTrash ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
            )}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Trash
          </button>
        </div>
        {activeTagFilter && (
          <Badge
            variant="tag"
            className="cursor-pointer"
            onClick={() => setActiveTagFilter(null)}
          >
            #{activeTagFilter} ×
          </Badge>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {notes.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">
              {showTrash ? "Trash is empty" : "No notes for this day"}
            </p>
          ) : (
            notes.map((note) => (
              <button
                key={note.id}
                type="button"
                onClick={() => setSelectedNoteId(note.id)}
                className={cn(
                  "w-full rounded-lg p-3 text-left transition-colors",
                  selectedNoteId === note.id
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-accent border border-transparent"
                )}
              >
                <h3 className="truncate text-sm font-medium">{note.title || "Untitled"}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {format(new Date(note.createdAt), "HH:mm")}
                </p>
                {showTrash ? (
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        restoreNote(note.id);
                      }}
                    >
                      Restore
                    </button>
                  </div>
                ) : (
                  note.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {note.tags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          variant="tag"
                          className="text-[10px]"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTagFilter(tag);
                          }}
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )
                )}
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
