import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest) {
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !state) {
    return NextResponse.redirect(new URL("/?error=linkedin_auth_failed", req.url));
  }

  try {
    // 1. Exchange state for access token
    const tokenRes = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      new URLSearchParams({
        grant_type: "authorization_code",
        state,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI!, // must match exactly what you registered
        clientId: process.env.AUTH_LINKEDIN_ID!,
        clientSecret: process.env.AUTH_LINKEDIN_SECRET!,
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const accessToken = tokenRes.data.access_token;

    // 2. Get basic profile
    const profileRes = await axios.get("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // userinfo returns: sub, name, email, picture, etc.
    // But we need the public LinkedIn profile URL

    // 3. Get the public profile URL (vanity name)
    // Note: LinkedIn restricted some fields. The most reliable way now is:
    const meRes = await axios.get(
      "https://api.linkedin.com/v2/me?projection=(id,vanityName,localizedFirstName,localizedLastName)",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const vanityName = meRes.data.vanityName;
    const linkedinUrl = vanityName
      ? `https://www.linkedin.com/in/${vanityName}`
      : null;

    if (!linkedinUrl) {
      return NextResponse.redirect(
        new URL("/?error=no_linkedin_url", req.url)
      );
    }

    // 4. Check if this person exists in your Innovate Finance API
    const apiRes = await axios.get(process.env.INNOVATE_API_URL!);
    const people = apiRes.data.data || apiRes.data;

    const clean = (url: string) =>
      url.toLowerCase().replace(/\/$/, "").split("?")[0];

    const matchedPerson = people.find((p: any) => {
      if (!p.social_icons) return false;
      return p.social_icons.some((icon: any) => {
        if (icon.icon_type !== "linkedin") return false;
        return clean(icon.social_network_url) === clean(linkedinUrl);
      });
    });

    if (!matchedPerson) {
      // User is not on the list
      return NextResponse.redirect(
        new URL("/?error=not_on_list", req.url)
      );
    }

    // 5. Success → create a session / JWT / cookie
    // Example using a simple cookie (replace with NextAuth / your auth system)
    const response = NextResponse.redirect(new URL("/mint", req.url));

    response.cookies.set("linkedin_url", linkedinUrl, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    response.cookies.set("person_id", matchedPerson.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("LinkedIn callback error:", err.response?.data || err.message);
    return NextResponse.redirect(
      new URL("/?error=linkedin_failed", req.url)
    );
  }
}