import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import crypto from "crypto"

export async function GET() {
  const state = crypto.randomBytes(16).toString("hex")

  const cookieStore = await cookies()

  // Store state in a short-lived cookie to prevent CSRF
  cookieStore.set("linkedin_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  })

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    redirect_uri: process.env.LINKEDIN_REDIRECT_URI!,
    state,
    scope: "openid profile email",
  })

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`

  return NextResponse.redirect(authUrl)
}