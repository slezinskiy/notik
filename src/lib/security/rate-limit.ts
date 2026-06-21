const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX) || 100;
const WINDOW_MS = 60_000;

export function rateLimit(identifier: string): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + WINDOW_MS });
    return { success: true, remaining: MAX_REQUESTS - 1 };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: MAX_REQUESTS - entry.count };
}

export function getRateLimitKey(request: Request, userId?: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  return userId ? `${userId}:${ip}` : ip;
}
