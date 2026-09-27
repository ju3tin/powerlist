import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    console.error("LinkedIn auth error:", error);
    return NextResponse.redirect(new URL("/?error=linkedin_auth_failed", req.url));
  }

  try {
    // 1. Exchange code for access token
    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append(
      "redirect_uri",
      "https://powerlist-nine.vercel.app/api/auth/callback/linkedin"
    );
    params.append("client_id", process.env.LINKEDIN_CLIENT_ID as string);
    params.append("client_secret", process.env.LINKEDIN_CLIENT_SECRET as string);

    const tokenRes = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      params.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = tokenRes.data.access_token;

    // 2. Get basic profile (OpenID)
    const profileRes = await axios.get("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const profile = profileRes.data;

    // 3. Try to get vanityName (public profile URL)
    let linkedinUrl: string | null = null;

    try {
      const meRes = await axios.get(
        "https://api.linkedin.com/v2/me?projection=(id,vanityName)",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (meRes.data?.vanityName) {
        linkedinUrl = `https://www.linkedin.com/in/${meRes.data.vanityName}`;
        console.log("Successfully got LinkedIn URL:", linkedinUrl);
      } else {
        console.log("vanityName is missing in response:", meRes.data);
      }
    } catch (vanityError: any) {
      // LinkedIn often blocks this endpoint now
      console.warn(
        "Could not fetch vanityName:",
        vanityError.response?.data || vanityError.message
      );
      // We continue without linkedinUrl
    }

    // 4. Decide where to send the user
    const redirectTo = linkedinUrl ? "/mint" : "/confirm-linkedin";

    const response = NextResponse.redirect(new URL(redirectTo, req.url));

    // Save basic LinkedIn data
    response.cookies.set("linkedin_sub", profile.sub, {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24, // 1 day
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

    // Only set linkedin_url if we successfully got it
    if (linkedinUrl) {
      response.cookies.set("linkedin_url", linkedinUrl, {
        httpOnly: true,
        secure: true,
        maxAge: 60 * 60 * 24,
        path: "/",
      });
    }

    return response;
  } catch (err: any) {
    console.error("LinkedIn callback error:", err.response?.data || err.message);
    return NextResponse.redirect(new URL("/?error=linkedin_failed", req.url));
  }
}