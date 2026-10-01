
import { NextResponse } from "next/server";

import {
  getLinkedInSession,
} from "@/lib/linkedin-auth";

import { connectDB } from "@/lib/mongodb";
import Profile from "@/models/Profile";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    /*
     * ------------------------------------------------
     * 1. Check the secure LinkedIn session
     * ------------------------------------------------
     */

    const session =
      await getLinkedInSession();

    if (!session) {
      return NextResponse.json(
        {
          authenticated: false,
          hasProfile: false,
          profile: null,
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    /*
     * ------------------------------------------------
     * 2. Find the Powerlist profile
     * ------------------------------------------------
     */

    await connectDB();

    const profile =
      await Profile.findOne({
        email: session.email,
      }).lean();

    /*
     * ------------------------------------------------
     * 3. Authenticated but no Powerlist profile
     * ------------------------------------------------
     */

    if (!profile) {
      return NextResponse.json(
        {
          authenticated: true,
          hasProfile: false,
          profile: null,
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    /*
     * ------------------------------------------------
     * 4. Authenticated + Powerlist profile
     * ------------------------------------------------
     */

    return NextResponse.json(
      {
        authenticated: true,
        hasProfile: true,
        profile: {
          id: profile.id,
          title: profile.title,
          slug: profile.slug,
          artist_title:
            profile.artist_title || "",
          featured_image:
            profile.featured_image || "",
          power_list_category:
            profile.power_list_category || "",
        },
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
      "LinkedIn profile check failed:",
      error
    );

    return NextResponse.json(
      {
        authenticated: false,
        hasProfile: false,
        profile: null,
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
