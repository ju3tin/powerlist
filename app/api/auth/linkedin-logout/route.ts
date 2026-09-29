import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const response = NextResponse.redirect(
    new URL("/", req.url)
  );

  // Remove your LinkedIn/user session cookie.
  //
  // Change "user_token" below if your actual
  // LinkedIn login uses a different cookie name.
  response.cookies.set({
    name: "user_token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  // If you have another LinkedIn session cookie,
  // remove it here too.
  response.cookies.set({
    name: "linkedin_session",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
