// app/api/auth/signin/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get("error");

  if (error === "MissingCSRF") {
    return NextResponse.redirect(
      new URL("/", request.url)
    );
  }

  return NextResponse.redirect(
    new URL("/", request.url)
  );
}
