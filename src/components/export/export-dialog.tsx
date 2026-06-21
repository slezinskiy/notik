"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useNotesStore } from "@/lib/stores/notes-store";
import { useSelectedNote } from "@/lib/hooks/use-notes-selectors";
import { useUIStore } from "@/lib/stores/ui-store";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { TranslationKey } from "@/lib/i18n/config";
import {
  singleNoteToMarkdown,
  dayNotesToMarkdown,
  monthNotesToMarkdown,
  allNotesToMarkdown,
} from "@/lib/markdown/export";
import { toMarkdownFilename } from "@/lib/utils";
import JSZip from "jszip";
import type { ExportScope } from "@/types/note";

const scopeKeys: Record<ExportScope, TranslationKey> = {
  note: "export.scopeNote",
  day: "export.scopeDay",
  month: "export.scopeMonth",
  all: "export.scopeAll",
};

export function ExportDialog() {
  const exportOpen = useUIStore((s) => s.exportOpen);
  const setExportOpen = useUIStore((s) => s.setExportOpen);
  const notes = useNotesStore((s) => s.notes);
  const selectedNote = useSelectedNote();
  const selectedDate = useNotesStore((s) => s.selectedDate);
  const [scope, setScope] = useState<ExportScope>("day");
  const { t } = useTranslation();

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    const activeNotes = notes.filter((n) => !n.deletedAt);

    if (scope === "note" && selectedNote) {
      downloadFile(singleNoteToMarkdown(selectedNote), `${selectedNote.title}.md`);
    } else if (scope === "day") {
      const dayNotes = activeNotes.filter(
        (n) => new Date(n.noteDate).toDateString() === selectedDate.toDateString()
      );
      downloadFile(dayNotesToMarkdown(dayNotes, selectedDate), toMarkdownFilename(selectedDate));
    } else if (scope === "month") {
      const monthNotes = activeNotes.filter((n) => {
        const d = new Date(n.noteDate);
        return d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
      });
      downloadFile(
        monthNotesToMarkdown(monthNotes, selectedDate),
        `notes_${selectedDate.getMonth() + 1}_${selectedDate.getFullYear()}.md`
      );
    } else if (scope === "all") {
      const zip = new JSZip();
      const byDay = new Map<string, typeof activeNotes>();

      for (const note of activeNotes) {
        const key = toMarkdownFilename(note.noteDate);
        const list = byDay.get(key) ?? [];
        list.push(note);
        byDay.set(key, list);
      }

      for (const [filename, dayNotes] of byDay) {
        zip.file(filename, dayNotesToMarkdown(dayNotes, new Date(dayNotes[0].noteDate)));
      }

      zip.file("all_notes.md", allNotesToMarkdown(activeNotes));
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "notik_export.zip";
      a.click();
      URL.revokeObjectURL(url);
    }

    setExportOpen(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const createNote = useNotesStore.getState().createNote;

    if (file.name.endsWith(".zip")) {
      const zip = await JSZip.loadAsync(file);
      for (const [filename, zipEntry] of Object.entries(zip.files)) {
        if (!filename.endsWith(".md") || zipEntry.dir) continue;
        const content = await zipEntry.async("string");
        const note = createNote(selectedDate);
        useNotesStore.getState().updateNote(note.id, { title: filename.replace(".md", ""), content });
      }
    } else {
      const content = await file.text();
      const note = createNote(selectedDate);
      useNotesStore.getState().updateNote(note.id, { title: file.name.replace(".md", ""), content });
    }

    e.target.value = "";
    setExportOpen(false);
  };

  return (
    <Dialog open={exportOpen} onOpenChange={setExportOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("export.title")}</DialogTitle>
          <DialogDescription>{t("export.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("export.scope")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["note", "day", "month", "all"] as ExportScope[]).map((s) => (
                <Button
                  key={s}
                  variant={scope === s ? "default" : "outline"}
                  size="sm"
                  onClick={() => setScope(s)}
                  disabled={s === "note" && !selectedNote}
                >
                  {t(scopeKeys[s])}
                </Button>
              ))}
            </div>
          </div>

          <Button onClick={handleExport} className="w-full">
            {t("export.exportButton")}
          </Button>

          <div className="space-y-2">
            <Label>{t("export.import")}</Label>
            <input
              type="file"
              accept=".md,.zip"
              onChange={handleImport}
              className="w-full text-sm"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
