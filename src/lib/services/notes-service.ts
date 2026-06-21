import { prisma } from "@/lib/db";
import { sanitizeHtml, sanitizeTags, sanitizeText } from "@/lib/security/sanitize";
import type { Note } from "@/types/note";
import { startOfDay } from "date-fns";

function mapNote(note: {
  id: string;
  title: string;
  content: string;
  noteDate: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  syncedAt: Date | null;
  userId: string;
  tags: { tag: { name: string } }[];
}): Note {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    tags: note.tags.map((t) => t.tag.name),
    noteDate: note.noteDate,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    deletedAt: note.deletedAt,
    syncedAt: note.syncedAt,
    userId: note.userId,
  };
}

const noteInclude = {
  tags: { include: { tag: true } },
} as const;

export async function getNotesForUser(userId: string, includeDeleted = false) {
  const notes = await prisma.note.findMany({
    where: {
      userId,
      ...(includeDeleted ? {} : { deletedAt: null }),
    },
    include: noteInclude,
    orderBy: { createdAt: "desc" },
  });
  return notes.map(mapNote);
}

export async function getNoteById(userId: string, id: string) {
  const note = await prisma.note.findFirst({
    where: { id, userId },
    include: noteInclude,
  });
  return note ? mapNote(note) : null;
}

export async function createNoteForUser(
  userId: string,
  data: {
    id?: string;
    title?: string;
    content?: string;
    tags?: string[];
    noteDate?: Date | string;
  }
) {
  const noteDate = data.noteDate
    ? startOfDay(new Date(data.noteDate))
    : startOfDay(new Date());

  const tags = sanitizeTags(data.tags ?? []);
  const title = sanitizeText(data.title ?? "Untitled");
  const content = sanitizeHtml(data.content ?? "");

  const note = await prisma.note.create({
    data: {
      ...(data.id ? { id: data.id } : {}),
      title,
      content,
      noteDate,
      userId,
      tags: {
        create: await Promise.all(
          tags.map(async (name) => {
            const tag = await prisma.tag.upsert({
              where: { userId_name: { userId, name } },
              create: { name, userId },
              update: {},
            });
            return { tagId: tag.id };
          })
        ),
      },
      revisions: {
        create: { title, content, tags },
      },
    },
    include: noteInclude,
  });

  return mapNote(note);
}

export async function updateNoteForUser(
  userId: string,
  id: string,
  data: {
    title?: string;
    content?: string;
    tags?: string[];
    noteDate?: Date | string;
    deletedAt?: Date | null;
  }
) {
  const existing = await prisma.note.findFirst({ where: { id, userId } });
  if (!existing) return null;

  const title = data.title !== undefined ? sanitizeText(data.title) : existing.title;
  const content = data.content !== undefined ? sanitizeHtml(data.content) : existing.content;
  const noteDate = data.noteDate ? startOfDay(new Date(data.noteDate)) : existing.noteDate;

  if (title !== existing.title || content !== existing.content) {
    const currentTags = data.tags ?? [];
    await prisma.noteRevision.create({
      data: {
        noteId: id,
        title: existing.title,
        content: existing.content,
        tags: currentTags.length ? currentTags : [],
      },
    });
  }

  if (data.tags) {
    await prisma.noteTag.deleteMany({ where: { noteId: id } });
    const tags = sanitizeTags(data.tags);
    for (const name of tags) {
      const tag = await prisma.tag.upsert({
        where: { userId_name: { userId, name } },
        create: { name, userId },
        update: {},
      });
      await prisma.noteTag.create({ data: { noteId: id, tagId: tag.id } });
    }
  }

  const note = await prisma.note.update({
    where: { id },
    data: {
      title,
      content,
      noteDate,
      ...(data.deletedAt !== undefined ? { deletedAt: data.deletedAt } : {}),
      syncedAt: new Date(),
    },
    include: noteInclude,
  });

  return mapNote(note);
}

export async function softDeleteNote(userId: string, id: string) {
  return updateNoteForUser(userId, id, { deletedAt: new Date() });
}

export async function getTagsForUser(userId: string) {
  const tags = await prisma.tag.findMany({
    where: { userId },
    include: { _count: { select: { notes: true } } },
    orderBy: { name: "asc" },
  });
  return tags.map((t) => ({ id: t.id, name: t.name, count: t._count.notes }));
}

export async function getCalendarData(userId: string, year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const notes = await prisma.note.findMany({
    where: {
      userId,
      deletedAt: null,
      noteDate: { gte: start, lte: end },
    },
    include: { tags: { include: { tag: true } } },
  });

  const dayMap = new Map<string, { noteCount: number; tags: Set<string> }>();

  for (const note of notes) {
    const key = note.noteDate.toISOString().split("T")[0];
    const entry = dayMap.get(key) ?? { noteCount: 0, tags: new Set<string>() };
    entry.noteCount++;
    note.tags.forEach((t) => entry.tags.add(t.tag.name));
    dayMap.set(key, entry);
  }

  return [...dayMap.entries()].map(([date, data]) => ({
    date,
    noteCount: data.noteCount,
    tags: [...data.tags],
  }));
}

export async function getNoteHistory(userId: string, noteId: string) {
  const note = await prisma.note.findFirst({ where: { id: noteId, userId } });
  if (!note) return null;

  return prisma.noteRevision.findMany({
    where: { noteId },
    orderBy: { createdAt: "desc" },
  });
}

export async function restoreRevision(userId: string, noteId: string, revisionId: string) {
  const note = await prisma.note.findFirst({ where: { id: noteId, userId } });
  if (!note) return null;

  const revision = await prisma.noteRevision.findFirst({
    where: { id: revisionId, noteId },
  });
  if (!revision) return null;

  return updateNoteForUser(userId, noteId, {
    title: revision.title,
    content: revision.content,
    tags: revision.tags,
  });
}
