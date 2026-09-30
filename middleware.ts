import { NextRequest, NextResponse } from "next/server";

export function middleware(
  request: NextRequest
) {
  const pathname =
    request.nextUrl.pathname;

  const token =
    request.cookies.get(
      "admin_token"
    )?.value;

  const isAdminPage =
    pathname.startsWith("/profiles") ||
    pathname.startsWith("/editticket") ||
    pathname.startsWith("/upload");

  const isLoginPage =
    pathname === "/login";

  /*
   * Protect admin pages.
   *
   * We only check that a session cookie
   * exists here.
   *
   * The actual session validation happens
   * in Node.js code/API routes.
   */
  if (isAdminPage && !token) {
    return NextResponse.redirect(
      new URL(
        "/login",
        request.url
      )
    );
  }

  /*
   * If there is a token, allow the request.
   *
   * Don't use MongoDB/Mongoose here.
   */
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/profiles/:path*",
    "/editticket/:path*",
    "/upload/:path*",
  ],
};