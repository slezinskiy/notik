"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useMemo } from "react";
import { EditorToolbar } from "./editor-toolbar";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotesStore } from "@/lib/stores/notes-store";
import { useSelectedNote } from "@/lib/hooks/use-notes-selectors";
import { useUIStore } from "@/lib/stores/ui-store";
import { debounce } from "@/lib/utils";
import { marked } from "marked";
import type { Note } from "@/types/note";

export function TipTapEditor() {
  const selectedNote = useSelectedNote();

  if (!selectedNote) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium">No note selected</p>
          <p className="mt-1 text-sm">Select a note or create a new one</p>
        </div>
      </div>
    );
  }

  return <NoteEditor key={selectedNote.id} note={selectedNote} />;
}

function NoteEditor({ note }: { note: Note }) {
  const updateNote = useNotesStore((s) => s.updateNote);
  const setIsSaving = useNotesStore((s) => s.setIsSaving);
  const previewMode = useUIStore((s) => s.previewMode);

  const debouncedSave = useMemo(
    () =>
      debounce((id: string, content: string, title: string) => {
        updateNote(id, { content, title });
        setIsSaving(false);
      }, 800),
    [updateNote, setIsSaving]
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2] } }),
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder: "Start writing..." }),
    ],
    content: note.content || "",
    onUpdate: ({ editor: ed }) => {
      setIsSaving(true);
      const html = ed.getHTML();
      const firstLine = ed.getText().split("\n")[0]?.slice(0, 100) || "Untitled";
      debouncedSave(note.id, html, firstLine);
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none min-h-[calc(100vh-220px)] focus:outline-none px-6 py-4",
      },
      handleDrop: (_view, event, _slice, moved) => {
        if (moved) return false;
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;

        const file = files[0];
        if (!file.type.startsWith("image/")) return false;

        event.preventDefault();
        const reader = new FileReader();
        reader.onload = () => {
          const url = reader.result as string;
          editor?.chain().focus().setImage({ src: url }).run();
        };
        reader.readAsDataURL(file);
        return true;
      },
    },
  });

  useEffect(() => {
    if (editor) {
      const current = editor.getHTML();
      if (current !== note.content) {
        editor.commands.setContent(note.content || "");
      }
    }
  }, [note.id, note.content, editor]);

  if (previewMode) {
    const html = marked.parse(note.content || "") as string;
    return (
      <div className="flex-1 overflow-auto">
        <div
          className="prose prose-sm dark:prose-invert max-w-none px-6 py-4"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b px-6 py-3">
        <input
          type="text"
          value={note.title}
          onChange={(e) => {
            updateNote(note.id, { title: e.target.value });
          }}
          className="flex-1 bg-transparent text-2xl font-bold focus:outline-none"
          placeholder="Note title"
          aria-label="Note title"
        />
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => useNotesStore.getState().deleteNote(note.id)}
          aria-label="Delete note"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <EditorToolbar editor={editor} />
      <div className="flex-1 overflow-auto">
        <EditorContent editor={editor} />
      </div>
      <TagInput noteId={note.id} tags={note.tags} />
    </div>
  );
}

function TagInput({ noteId, tags }: { noteId: string; tags: string[] }) {
  const updateNote = useNotesStore((s) => s.updateNote);
  const setActiveTagFilter = useNotesStore((s) => s.setActiveTagFilter);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = e.currentTarget.value.replace(/^#/, "").trim().toLowerCase();
      if (value && !tags.includes(value)) {
        updateNote(noteId, { tags: [...tags, value] });
      }
      e.currentTarget.value = "";
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-t px-6 py-3">
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
          onClick={() => setActiveTagFilter(tag)}
        >
          #{tag}
          <span
            className="ml-1 opacity-60 hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              updateNote(noteId, { tags: tags.filter((t) => t !== tag) });
            }}
          >
            ×
          </span>
        </button>
      ))}
      <input
        type="text"
        placeholder="Add tag..."
        className="min-w-[100px] flex-1 bg-transparent text-sm focus:outline-none"
        onKeyDown={handleKeyDown}
        aria-label="Add tag"
      />
    </div>
  );
}
