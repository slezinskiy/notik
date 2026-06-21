import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/helpers";
import { getTagsForUser } from "@/lib/services/notes-service";

export async function GET(request: Request) {
  const result = await withAuth(request);
  if ("error" in result && result.error) return result.error;

  const tags = await getTagsForUser(result.session!.user.id);
  return NextResponse.json(tags);
}
