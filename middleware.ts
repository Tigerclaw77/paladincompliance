import { NextResponse } from "next/server";
import { auth } from "@/auth";

const protectedRoutes = [
  "/admin",
  "/dashboard",
  "/onboarding",
  "/start/growth",
  "/start/starter",
];

export default auth((request) => {
  const isAuthenticated = Boolean(request.auth);
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
});

export const config = {
  matcher: [
    "/login",
    "/admin/:path*",
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/start/growth",
    "/start/starter",
  ],
};
