import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit, getRateLimitKey } from "@/lib/security/rate-limit";
import { csrfGuard } from "@/lib/security/csrf";

export async function withAuth(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const csrf = csrfGuard(request);
  if (csrf) return { error: csrf };

  const limit = rateLimit(getRateLimitKey(request, session.user.id));
  if (!limit.success) {
    return {
      error: NextResponse.json({ error: "Too many requests" }, { status: 429 }),
    };
  }

  return { session };
}
