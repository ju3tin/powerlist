import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription =
    searchParams.get("error_description");

  // LinkedIn returned an error
  if (error) {
    return NextResponse.json(
      {
        error,
        error_description: errorDescription,
      },
      { status: 400 }
    );
  }

  // No authorization code
  if (!code) {
    return NextResponse.json(
      {
        error:
          "Missing LinkedIn authorization code",
      },
      { status: 400 }
    );
  }

  const clientId =
    process.env.AUTH_LINKEDIN_ID;

  const clientSecret =
    process.env.AUTH_LINKEDIN_SECRET;

  const redirectUri =
    process.env.LINKEDIN_REDIRECT_URI;

  if (
    !clientId ||
    !clientSecret ||
    !redirectUri
  ) {
    return NextResponse.json(
      {
        error:
          "LinkedIn environment variables are not configured",
      },
      { status: 500 }
    );
  }

  try {
    // --------------------------------------------------
    // 1. Exchange authorization code for access token
    // --------------------------------------------------

    const tokenResponse = await fetch(
      "https://www.linkedin.com/oauth/v2/accessToken",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
        }),
      }
    );

    const tokenData =
      await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error(
        "LinkedIn token error:",
        tokenData
      );

      return NextResponse.json(
        {
          error:
            "Failed to obtain LinkedIn access token",
          details: tokenData,
        },
        { status: 400 }
      );
    }

    const accessToken =
      tokenData.access_token;

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            "LinkedIn did not return an access token",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 2. Get LinkedIn user information
    // --------------------------------------------------

    const userResponse = await fetch(
      "https://api.linkedin.com/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const userData =
      await userResponse.json();

    if (!userResponse.ok) {
      console.error(
        "LinkedIn userinfo error:",
        userData
      );

      return NextResponse.json(
        {
          error:
            "Failed to get LinkedIn profile",
          details: userData,
        },
        { status: 400 }
      );
    }

    /*
      LinkedIn OpenID Connect normally returns:

      sub
      name
      given_name
      family_name
      picture
      email
    */

    const linkedinId =
      userData.sub;

    const name =
      userData.name ||
      `${userData.given_name || ""} ${
        userData.family_name || ""
      }`.trim();

    const email =
      userData.email || "";

    const picture =
      userData.picture || "";

    if (!linkedinId) {
      return NextResponse.json(
        {
          error:
            "LinkedIn user ID was not returned",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 3. Create your application session
    // --------------------------------------------------

    /*
      For now we store the LinkedIn user information
      in a signed/encrypted-style session cookie.

      If you already have a User model/session system,
      this is where we can connect it.
    */

    const session = {
      linkedinId,
      name,
      email,
      picture,
    };

    const response =
      NextResponse.redirect(
        new URL("/", request.url)
      );

    response.cookies.set({
      name: "linkedin_session",
      value: encodeURIComponent(
        JSON.stringify(session)
      ),
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    console.error(
      "LinkedIn callback error:",
      err
    );

    return NextResponse.json(
      {
        error:
          "LinkedIn authentication failed",
      },
      { status: 500 }
    );
  }
}
