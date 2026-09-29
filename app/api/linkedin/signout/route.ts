import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();

  // Auth.js / NextAuth v5
  cookieStore.delete("authjs.session-token");
  cookieStore.delete("__Secure-authjs.session-token");

  // NextAuth v4 / alternative cookie names
  cookieStore.delete("next-auth.session-token");
  cookieStore.delete("__Secure-next-auth.session-token");

  // Clear callback cookies
  cookieStore.delete("authjs.callback-url");
  cookieStore.delete("__Secure-authjs.callback-url");

  cookieStore.delete("next-auth.callback-url");
  cookieStore.delete("__Secure-next-auth.callback-url");

  return NextResponse.redirect(new URL("/", process.env.NEXTAUTH_URL));
}
