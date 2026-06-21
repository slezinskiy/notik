import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/register");
  const isAppPage = req.nextUrl.pathname.startsWith("/app");

  if (isAppPage && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/app", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/app/:path*", "/login", "/register"],
};
