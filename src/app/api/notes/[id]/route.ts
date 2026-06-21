import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/helpers";
import {
  getNoteById,
  updateNoteForUser,
  softDeleteNote,
} from "@/lib/services/notes-service";
import { noteUpdateSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const result = await withAuth(request);
  if ("error" in result && result.error) return result.error;

  const { id } = await context.params;
  const note = await getNoteById(result.session!.user.id, id);
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(note);
}

export async function PUT(request: Request, context: RouteContext) {
  const result = await withAuth(request);
  if ("error" in result && result.error) return result.error;

  const { id } = await context.params;
  const body = await request.json();
  const parsed = noteUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const note = await updateNoteForUser(result.session!.user.id, id, {
    ...parsed.data,
    deletedAt: body.deletedAt === null ? null : body.deletedAt ? new Date(body.deletedAt) : undefined,
  });

  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(note);
}

export async function DELETE(request: Request, context: RouteContext) {
  const result = await withAuth(request);
  if ("error" in result && result.error) return result.error;

  const { id } = await context.params;
  const note = await softDeleteNote(result.session!.user.id, id);
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(note);
}
