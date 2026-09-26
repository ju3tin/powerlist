import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

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
        error: "Missing LinkedIn authorization code",
      },
      { status: 400 }
    );
  }

  // At this point LinkedIn has successfully authenticated the user.
  // The next step is to exchange `code` for an access token.

  return NextResponse.json({
    success: true,
    message: "LinkedIn callback received",
    code_received: true,
  });
}