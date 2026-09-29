// app/api/auth/signin/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get("error");

  if (error === "MissingCSRF") {
    return NextResponse.redirect(
      new URL("/", request.url)
    );
  }
  // If the user is already logged in, redirect to the home page

  return NextResponse.redirect(
    new URL("/", request.url)
  );
}
