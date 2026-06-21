import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/helpers";
import { getCalendarData } from "@/lib/services/notes-service";

export async function GET(request: Request) {
  const result = await withAuth(request);
  if ("error" in result && result.error) return result.error;

  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year") ?? new Date().getFullYear());
  const month = Number(searchParams.get("month") ?? new Date().getMonth() + 1);

  const data = await getCalendarData(result.session!.user.id, year, month);
  return NextResponse.json(data);
}
