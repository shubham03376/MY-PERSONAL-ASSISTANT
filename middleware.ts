import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, COOKIE_NAME } from "./lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that do not require login
  const isPublicAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname === "/logo.jpg" ||
    pathname === "/logo.png" ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".webp") ||
    pathname.endsWith(".zip");

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/api/auth/");

  if (isPublicAsset) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // Root entrance http://localhost:3000/ ALWAYS redirects to the authentication page
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Auth pages (/login, /register) are always accessible directly
  if (isAuthPage) {
    return NextResponse.next();
  }

  // Guard protected routes
  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized access. Please log in." }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Guard Admin routes (/admin, /api/admin/*)
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (session.role !== "admin" || session.username.toLowerCase() !== "shubham@1700") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Forbidden: Platform owner developer administrator access required." },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/login?error=admin_required", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
