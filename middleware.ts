import { type NextRequest, NextResponse } from "next/server";

const protectedRoutes = [
  "/admin",
  "/dashboard",
  "/onboarding",
  "/start/growth",
  "/start/operational",
  "/start/starter",
];

const authSessionCookieNames = [
  "__Secure-authjs.session-token",
  "authjs.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
] as const;

export default function middleware(request: NextRequest) {
  const hasSession = hasAuthSessionCookie(request);
  const { nextUrl } = request;
  const isProtectedRoute = protectedRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );

  if (!hasSession && isProtectedRoute) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set(
      "callbackUrl",
      `${nextUrl.pathname}${nextUrl.search}`
    );

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

function hasAuthSessionCookie(request: NextRequest) {
  return request.cookies.getAll().some((cookie) => {
    if (!cookie.value) {
      return false;
    }

    return authSessionCookieNames.some(
      (name) => cookie.name === name || cookie.name.startsWith(`${name}.`)
    );
  });
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/start/growth",
    "/start/operational",
    "/start/starter",
  ],
};
