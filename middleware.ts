import { NextRequest, NextResponse } from "next/server";


const protectedRoutes = [
 
  "/settings/content/manager",
];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isProtectedRoute = protectedRoutes.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const session = request.cookies.get("session")?.value;

  if (!session) {
    const loginUrl = new URL("/auth", request.url);

    loginUrl.searchParams.set(
      "redirect",
      pathname
    );

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/settings/content/manager/:path*",
  ],
};