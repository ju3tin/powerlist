import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import Profile from "@/models/Profile";

function normaliseLinkedInUrl(value: string) {
  if (!value) return "";

  let url = decodeURIComponent(value)
    .trim()
    .toLowerCase();

  // Handle markdown URLs
  const markdownMatch = url.match(
    /\((https?:\/\/[^)]+)\)/
  );

  if (markdownMatch) {
    url = markdownMatch[1];
  }

  url = url
    .replace(/^<|>$/g, "")
    .replace(/\/+$/, "")
    .replace(
      "https://www.linkedin.com",
      "https://linkedin.com"
    );

  return url;
}

export async function POST(req: NextRequest) {
  try {
    // -----------------------------------------
    // 1. Get authenticated LinkedIn email
    // -----------------------------------------

    const emailCookie =
      req.cookies.get("linkedin_email")?.value;

    if (!emailCookie) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please sign in with LinkedIn first.",
        },
        { status: 401 }
      );
    }

    const email = decodeURIComponent(
      emailCookie
    )
      .trim()
      .toLowerCase();

    // -----------------------------------------
    // 2. Get LinkedIn URL
    // -----------------------------------------

    const body = await req.json();

    const linkedinUrl = normaliseLinkedInUrl(
      body.linkedinUrl || ""
    );

    if (!linkedinUrl) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please enter your LinkedIn profile URL.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // -----------------------------------------
    // 3. Find profiles containing LinkedIn
    // -----------------------------------------

    const profiles = await Profile.find({
      "social_icons.icon_type": "linkedin",
    });

    let profile = null;

    for (const item of profiles) {
      const linkedinIcon =
        item.social_icons?.find(
          (icon: any) =>
            icon.icon_type?.toLowerCase() ===
            "linkedin"
        );

      if (
        !linkedinIcon?.social_network_url
      ) {
        continue;
      }

      const existingUrl =
        normaliseLinkedInUrl(
          linkedinIcon.social_network_url
        );

      if (existingUrl === linkedinUrl) {
        profile = item;
        break;
      }
    }

    // -----------------------------------------
    // 4. LinkedIn URL not found
    // -----------------------------------------

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error:
            "We couldn't find a Powerlist profile with that LinkedIn URL.",
        },
        { status: 404 }
      );
    }

    // -----------------------------------------
    // 5. Profile already claimed
    // -----------------------------------------

    if (profile.email) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This profile has already been claimed.",
        },
        { status: 409 }
      );
    }

    // -----------------------------------------
    // 6. Add authenticated email
    // -----------------------------------------

    profile.email = email;

    await profile.save();

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        slug: profile.slug,
        title: profile.title,
        email: profile.email,
      },
    });
  } catch (error) {
    console.error(
      "CLAIM PROFILE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to claim profile.",
      },
      { status: 500 }
    );
  }
}