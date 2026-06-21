import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/helpers";
import { getNoteHistory, restoreRevision } from "@/lib/services/notes-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const result = await withAuth(request);
  if ("error" in result && result.error) return result.error;

  const { id } = await context.params;
  const history = await getNoteHistory(result.session!.user.id, id);
  if (!history) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(history);
}

export async function POST(request: Request, context: RouteContext) {
  const result = await withAuth(request);
  if ("error" in result && result.error) return result.error;

  const { id } = await context.params;
  const { revisionId } = await request.json();

  const note = await restoreRevision(result.session!.user.id, id, revisionId);
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(note);
}
