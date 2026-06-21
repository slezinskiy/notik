import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { withAuth } from "@/lib/api/helpers";
import { syncSchema } from "@/lib/validations";
import {
  createNoteForUser,
  updateNoteForUser,
  getNotesForUser,
} from "@/lib/services/notes-service";

export async function POST(request: Request) {
  const result = await withAuth(request);
  if ("error" in result && result.error) return result.error;

  const body = await request.json();
  const parsed = syncSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const userId = result.session!.user.id;
  let conflicts = 0;

  for (const op of parsed.data.operations) {
    const payload = op.payload as Record<string, unknown>;

    try {
      if (op.entityType === "note") {
        const existing = await prisma.note.findFirst({
          where: { id: op.entityId, userId },
        });

        if (op.operation === "create") {
          if (!existing) {
            await createNoteForUser(userId, {
              id: op.entityId,
              title: payload.title as string,
              content: payload.content as string,
              tags: payload.tags as string[],
              noteDate: payload.noteDate as string,
            });
          }
        } else if (op.operation === "update" || op.operation === "restore") {
          if (existing) {
            const clientUpdated = new Date(payload.updatedAt as string);
            if (clientUpdated >= existing.updatedAt) {
              await updateNoteForUser(userId, op.entityId, {
                title: payload.title as string,
                content: payload.content as string,
                tags: payload.tags as string[],
                noteDate: payload.noteDate as string,
                deletedAt: op.operation === "restore" ? null : undefined,
              });
            } else {
              conflicts++;
              await prisma.noteRevision.create({
                data: {
                  noteId: op.entityId,
                  title: payload.title as string,
                  content: payload.content as string,
                  tags: (payload.tags as string[]) ?? [],
                },
              });
            }
          } else {
            await createNoteForUser(userId, {
              id: op.entityId,
              title: payload.title as string,
              content: payload.content as string,
              tags: payload.tags as string[],
              noteDate: payload.noteDate as string,
            });
          }
        } else if (op.operation === "delete") {
          if (existing) {
            await updateNoteForUser(userId, op.entityId, {
              deletedAt: new Date(),
            });
          }
        }

        await prisma.syncQueueItem.create({
          data: {
            userId,
            entityType: op.entityType,
            entityId: op.entityId,
            operation: op.operation,
            payload: op.payload as Prisma.InputJsonValue,
            processedAt: new Date(),
          },
        });
      }
    } catch (err) {
      console.error("Sync error:", err);
    }
  }

  const notes = await getNotesForUser(userId, true);
  return NextResponse.json({ success: true, conflicts, notes });
}

export async function GET(request: Request) {
  const result = await withAuth(request);
  if ("error" in result && result.error) return result.error;

  const notes = await getNotesForUser(result.session!.user.id, true);
  return NextResponse.json({ notes });
}
