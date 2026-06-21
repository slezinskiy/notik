"use client";

import { useMemo, useState } from "react";
import Fuse from "fuse.js";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useNotesStore } from "@/lib/stores/notes-store";
import { useUIStore } from "@/lib/stores/ui-store";
import { format } from "date-fns";

export function SearchDialog() {
  const searchOpen = useUIStore((s) => s.searchOpen);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const notes = useNotesStore((s) => s.notes);
  const setSelectedNoteId = useNotesStore((s) => s.setSelectedNoteId);
  const setSelectedDate = useNotesStore((s) => s.setSelectedDate);
  const [query, setQuery] = useState("");

  const fuse = useMemo(
    () =>
      new Fuse(
        notes.filter((n) => !n.deletedAt),
        {
          keys: ["title", "content", "tags"],
          threshold: 0.4,
          includeScore: true,
        }
      ),
    [notes]
  );

  const results = query.trim() ? fuse.search(query, { limit: 15 }) : [];

  const handleSelect = (noteId: string, noteDate: Date) => {
    setSelectedDate(noteDate);
    setSelectedNoteId(noteId);
    setSearchOpen(false);
    setQuery("");
  };

  return (
    <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Search Notes</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by title, content, or tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
        <div className="max-h-[300px] overflow-auto">
          {results.length === 0 && query.trim() ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No results found</p>
          ) : (
            results.map(({ item }) => (
              <button
                key={item.id}
                type="button"
                className="w-full rounded-lg p-3 text-left hover:bg-accent"
                onClick={() => handleSelect(item.id, new Date(item.noteDate))}
              >
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(item.noteDate), "dd MMM yyyy")}
                  {item.tags.length > 0 && ` • ${item.tags.map((t) => `#${t}`).join(" ")}`}
                </p>
              </button>
            ))
          )}
        </div>
        <p className="text-xs text-muted-foreground">Press Ctrl+K to open search</p>
      </DialogContent>
    </Dialog>
  );
}
