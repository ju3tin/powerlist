import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.AUTH_LINKEDIN_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: "AUTH_LINKEDIN_ID is not configured" },
      { status: 500 }
    );
  }

  const redirectUri =
    process.env.LINKEDIN_REDIRECT_URI;

  if (!redirectUri) {
    return NextResponse.json(
      { error: "LINKEDIN_REDIRECT_URI is not configured" },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "openid profile email",
  });

  return NextResponse.redirect(
    `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
  );
}