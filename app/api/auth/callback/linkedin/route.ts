import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

import { connectDB } from "@/lib/mongodb";
import Profile from "@/models/Profile";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    console.error("LinkedIn error:", error);

    return NextResponse.redirect(
      new URL(
        "/login?error=linkedin_auth_failed",
        req.url
      )
    );
  }

  try {
    const redirectUri =
      process.env.LINKEDIN_REDIRECT_URI;

    if (!redirectUri) {
      throw new Error(
        "LINKEDIN_REDIRECT_URI is not configured"
      );
    }

    // -----------------------------------------
    // 1. Exchange authorization code for token
    // -----------------------------------------

    const tokenRes = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: process.env.AUTH_LINKEDIN_ID!,
        client_secret: process.env.AUTH_LINKEDIN_SECRET!,
      }),
      {
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken =
      tokenRes.data.access_token;

    // -----------------------------------------
    // 2. Get LinkedIn user information
    // -----------------------------------------

    const profileRes = await axios.get(
      "https://api.linkedin.com/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const linkedin = profileRes.data;

    console.log(
      "LinkedIn profile:",
      linkedin
    );

    if (!linkedin.email) {
      return NextResponse.redirect(
        new URL(
          "/login?error=no_linkedin_email",
          req.url
        )
      );
    }

    const email = linkedin.email
      .trim()
      .toLowerCase();

    await connectDB();

    // -----------------------------------------
    // 3. Check whether email already exists
    // -----------------------------------------

    const escapedEmail = email.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    const profile = await Profile.findOne({
      email: {
        $regex: `^${escapedEmail}$`,
        $options: "i",
      },
    });

    // -----------------------------------------
    // 4. Create response
    // -----------------------------------------

    const response = NextResponse.redirect(
      new URL(
        profile
          ? `/profiles/${profile.slug}`
          : "/login?claim=true",
        req.url
      )
    );

    // -----------------------------------------
    // 5. Login cookies
    // -----------------------------------------

    const cookieOptions = {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24,
      path: "/",
    };

    response.cookies.set(
      "linkedin_email",
      email,
      cookieOptions
    );

    response.cookies.set(
      "linkedin_sub",
      linkedin.sub || "",
      cookieOptions
    );

    response.cookies.set(
      "linkedin_name",
      linkedin.name || "",
      cookieOptions
    );

    response.cookies.set(
      "linkedin_picture",
      linkedin.picture || "",
      cookieOptions
    );

    response.cookies.set(
      "linkedin_first_name",
      linkedin.given_name || "",
      cookieOptions
    );

    response.cookies.set(
      "linkedin_last_name",
      linkedin.family_name || "",
      cookieOptions
    );

    return response;
  } catch (err: any) {
    console.error(
      "LinkedIn callback error:",
      err.response?.data || err.message
    );

    return NextResponse.redirect(
      new URL(
        "/login?error=linkedin_failed",
        req.url
      )
    );
  }
}