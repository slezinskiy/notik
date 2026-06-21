import { NextResponse } from "next/server";

export function verifyCsrf(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || !host) return true;

  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    return false;
  }
}

export function csrfGuard(request: Request): NextResponse | null {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return null;

  if (!verifyCsrf(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  return null;
}
