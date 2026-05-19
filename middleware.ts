import { getToken } from "next-auth/jwt";
import { type NextRequest, NextResponse } from "next/server";

const protectedRoutes = [
  "/admin",
  "/dashboard",
  "/onboarding",
  "/start/growth",
  "/start/operational",
  "/start/starter",
];

export default async function middleware(request: NextRequest) {
  const isAuthenticated = await hasValidSessionToken(request);
  const { nextUrl } = request;
  const isProtectedRoute = protectedRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );

  if (!isAuthenticated && isProtectedRoute) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set(
      "callbackUrl",
      `${nextUrl.pathname}${nextUrl.search}`
    );

    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
}

async function hasValidSessionToken(request: NextRequest) {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    return false;
  }

  const token = await getToken({
    req: request,
    secret,
    secureCookie: process.env.NODE_ENV === "production",
  });

  return Boolean(token);
}

export const config = {
  matcher: [
    "/login",
    "/admin/:path*",
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/start/growth",
    "/start/operational",
    "/start/starter",
  ],
};
