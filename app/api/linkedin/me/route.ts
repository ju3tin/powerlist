import { NextResponse } from "next/server";

import {
  getLinkedInSession,
} from "@/lib/linkedin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session =
      await getLinkedInSession();

    // No valid server-side session
    if (!session) {
      return NextResponse.json(
        {
          authenticated: false,
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    // Return only information needed by the frontend.
    // Do NOT return the sessionId.
    return NextResponse.json(
      {
        authenticated: true,
        name: session.name || "",
        firstName: session.firstName || "",
        lastName: session.lastName || "",
        picture: session.picture || "",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "LinkedIn /me error:",
      error
    );

    return NextResponse.json(
      {
        authenticated: false,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
