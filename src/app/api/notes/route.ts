import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/helpers";
import { getNotesForUser, createNoteForUser } from "@/lib/services/notes-service";
import { noteSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const result = await withAuth(request);
  if ("error" in result && result.error) return result.error;

  const { searchParams } = new URL(request.url);
  const includeDeleted = searchParams.get("includeDeleted") === "true";

  const notes = await getNotesForUser(result.session!.user.id, includeDeleted);
  return NextResponse.json(notes);
}

export async function POST(request: Request) {
  const result = await withAuth(request);
  if ("error" in result && result.error) return result.error;

  const body = await request.json();
  const parsed = noteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const note = await createNoteForUser(result.session!.user.id, {
    id: body.id,
    ...parsed.data,
    noteDate: parsed.data.noteDate,
  });

  return NextResponse.json(note, { status: 201 });
}
