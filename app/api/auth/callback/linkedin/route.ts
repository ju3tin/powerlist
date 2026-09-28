// app/api/auth/callback/linkedin/route.ts
// or whatever path you are using

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    console.error("LinkedIn error param:", error);
    return NextResponse.redirect(new URL("/?error=linkedin_auth_failed", req.url));
  }

  try {
    // 1. Exchange code → access token
    const tokenRes = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: "https://powerlist-nine.vercel.app/api/auth/callback/linkedin", // ← MUST be exact
        client_id: process.env.AUTH_LINKEDIN_ID!,
        client_secret: process.env.AUTH_LINKEDIN_SECRET!,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = tokenRes.data.access_token;

    // 2. Get user info (OpenID)
    const profileRes = await axios.get("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const profile = profileRes.data;
    console.log("LinkedIn profile:", profile);

    // LinkedIn OpenID does NOT give you the public profile URL directly.
    // We only get: sub, name, email, picture, given_name, family_name, locale, etc.

    // For matching against your API we will use the email or name for now,
    // or you can ask the user to confirm their LinkedIn URL later.

    // Temporary: save what we have
    const response = NextResponse.redirect(new URL("/mint", req.url));

    response.cookies.set("linkedin_sub", profile.sub, {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    response.cookies.set("linkedin_picture", profile.picture || "", {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24,
      path: "/",
    });
    response.cookies.set("linkedin_first_name", profile.given_name || "", {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24,
      path: "/",
    });
    response.cookies.set("linkedin_last_name", profile.family_name || "", {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24,
      path: "/",
    });
    
    response.cookies.set("linkedin_name", profile.name || "", {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    response.cookies.set("linkedin_email", profile.email || "", {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("LinkedIn callback error:", err.response?.data || err.message);
    return NextResponse.redirect(new URL("/?error=linkedin_failed", req.url));
  }
}