
import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import LinkedInSession from "@/models/LinkedInSession";

export const dynamic = "force-dynamic";

const cookiesToClear = [
  "linkedin_session",
  "linkedin_email",
  "linkedin_sub",
  "linkedin_name",
  "linkedin_picture",
  "linkedin_first_name",
  "linkedin_last_name",
  "linkedin_profile",
  "profile",
  "profile_id",
];

export async function POST(req: NextRequest) {
  try {
    const sessionId = req.cookies.get("linkedin_session")?.value;

    // Invalidate the server-side session.
    if (sessionId) {
      await connectDB();
      await LinkedInSession.deleteOne({ sessionId });
    }

    const response = NextResponse.json({
      success: true,
      redirect: "/",
    });

    // Clear the authentication and profile cookies.
    for (const name of cookiesToClear) {
      response.cookies.set(name, "", {
        httpOnly: name === "linkedin_session",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: new Date(0),
        path: "/",
      });
    }

    response.headers.set("Cache-Control", "no-store");

    return response;
  } catch (error) {
    console.error("Logout error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to sign out." },
      { status: 500 }
    );
  }
}

// Keep compatibility with existing links to /api/auth/logout.
export async function GET(req: NextRequest) {
  const sessionId = req.cookies.get("linkedin_session")?.value;

  try {
    if (sessionId) {
      await connectDB();
      await LinkedInSession.deleteOne({ sessionId });
    }
  } catch (error) {
    console.error("Logout error:", error);
  }

  const response = NextResponse.redirect(new URL("/", req.url));

  for (const name of cookiesToClear) {
    response.cookies.set(name, "", {
      httpOnly: name === "linkedin_session",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0),
      path: "/",
    });
  }

  return response;
}