import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { SignJWT } from "jose"

const secret = new TextEncoder().encode(process.env.SESSION_SECRET!)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${error}`, req.url))
  }

  const cookieStore = await cookies()

  // Verify state (CSRF protection)
  const storedState = cookieStore.get("linkedin_oauth_state")?.value
  if (!state || state !== storedState) {
    return NextResponse.redirect(new URL("/?error=invalid_state", req.url))
  }

  // Clear the state cookie
  cookieStore.delete("linkedin_oauth_state")

  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", req.url))
  }

  // 1. Exchange code for access token
  const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.LINKEDIN_REDIRECT_URI!,
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
    }),
  })

  const tokenData = await tokenRes.json()

  if (!tokenRes.ok || !tokenData.access_token) {
    console.error("Token error:", tokenData)
    return NextResponse.redirect(new URL("/?error=token_failed", req.url))
  }

  // 2. Get user profile
  const userRes = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  })

  const profile = await userRes.json()

  if (!userRes.ok) {
    console.error("Userinfo error:", profile)
    return NextResponse.redirect(new URL("/?error=userinfo_failed", req.url))
  }

  // 3. Create session JWT
  const token = await new SignJWT({
    id: profile.sub,
    name: profile.name,
    email: profile.email,
    image: profile.picture,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret)

  // Set the session cookie
  const response = NextResponse.redirect(new URL("/dashboard", req.url))

  response.cookies.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })

  return response
}