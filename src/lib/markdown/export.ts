import type { Note } from "@/types/note";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";
import { stripHtml } from "@/lib/utils";

export function noteToMarkdownSection(note: Note): string {
  const tagLine =
    note.tags.length > 0
      ? `\n\nTags:\n${note.tags.map((t) => `#${t}`).join(" ")}\n`
      : "";

  return `## ${note.title}\n\n${stripHtml(note.content)}${tagLine}\n---\n`;
}

export function dayNotesToMarkdown(notes: Note[], date: Date): string {
  const header = `# Daily Notes — ${format(date, "dd MMMM yyyy")}\n\n`;
  const body = notes
    .filter((n) => !n.deletedAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(noteToMarkdownSection)
    .join("\n");
  return header + body;
}

export function monthNotesToMarkdown(notes: Note[], month: Date): string {
  const header = `# Notes — ${format(month, "MMMM yyyy")}\n\n`;
  const byDay = new Map<string, Note[]>();

  for (const note of notes.filter((n) => !n.deletedAt)) {
    const key = format(new Date(note.noteDate), "yyyy-MM-dd");
    const list = byDay.get(key) ?? [];
    list.push(note);
    byDay.set(key, list);
  }

  const days = [...byDay.keys()].sort();
  let content = header;

  for (const day of days) {
    const dayNotes = byDay.get(day)!;
    content += `\n## ${format(new Date(day), "dd MMMM yyyy")}\n\n`;
    content += dayNotes.map(noteToMarkdownSection).join("\n");
  }

  return content;
}

export function allNotesToMarkdown(notes: Note[]): string {
  const header = `# Notik Export — ${format(new Date(), "dd MMMM yyyy HH:mm")}\n\n`;
  const byDay = new Map<string, Note[]>();

  for (const note of notes.filter((n) => !n.deletedAt)) {
    const key = format(new Date(note.noteDate), "yyyy-MM-dd");
    const list = byDay.get(key) ?? [];
    list.push(note);
    byDay.set(key, list);
  }

  let content = header;
  for (const day of [...byDay.keys()].sort()) {
    content += dayNotesToMarkdown(byDay.get(day)!, new Date(day));
    content += "\n";
  }

  return content;
}

export function singleNoteToMarkdown(note: Note): string {
  return noteToMarkdownSection(note);
}

export function getDateRangeForScope(
  scope: "day" | "month",
  date: Date
): { start: Date; end: Date } {
  if (scope === "day") {
    return { start: startOfDay(date), end: endOfDay(date) };
  }
  return { start: startOfMonth(date), end: endOfMonth(date) };
}

export function parseImportedMarkdown(content: string, noteDate: Date): Partial<Note>[] {
  const notes: Partial<Note>[] = [];
  const sections = content.split(/^---$/m).filter(Boolean);

  for (const section of sections) {
    const titleMatch = section.match(/^##\s+(.+)$/m);
    if (!titleMatch) continue;

    const title = titleMatch[1].trim();
    let body = section.replace(/^##\s+.+$/m, "").trim();

    const tagsMatch = body.match(/Tags:\s*\n((?:#\w+\s*)+)/);
    let tags: string[] = [];
    if (tagsMatch) {
      tags = tagsMatch[1].match(/#(\w+)/g)?.map((t) => t.slice(1)) ?? [];
      body = body.replace(/Tags:\s*\n(?:#\w+\s*)+/, "").trim();
    }

    notes.push({
      title,
      content: body,
      tags,
      noteDate,
    });
  }

  return notes;
}
