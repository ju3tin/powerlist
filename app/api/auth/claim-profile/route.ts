import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { normalizeLinkedInUrl, extractLinkedInVanity } from "@/lib/linkedin";
import ProfileModel from "@/models/Profile";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    // 1. Try Auth.js session first
    const session = await auth();

    // 2. Also read the custom LinkedIn cookies you already have
    const cookieStore = await cookies();
    const linkedinSub = cookieStore.get("linkedin_sub")?.value;
    const linkedinEmail = cookieStore.get("linkedin_email")?.value;
    const linkedinName = cookieStore.get("linkedin_name")?.value;

    // Must have either a session or the LinkedIn cookies
    if (!session?.user && !linkedinSub) {
      return NextResponse.json(
        { error: "Please login with LinkedIn first" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const linkedinUrl = body.linkedinUrl as string;

    const normalized = normalizeLinkedInUrl(linkedinUrl);
    if (!normalized) {
      return NextResponse.json(
        {
          error:
            "Invalid LinkedIn URL. Example: https://www.linkedin.com/in/abbythomas/",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Find matching Powerlist profile
    const profile = await ProfileModel.findOne({
      "social_icons.social_network_url": {
        $regex: new RegExp(
          normalized.replace("https://www.", "").replace(/\/$/, ""),
          "i"
        ),
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "No Powerlist profile found with that LinkedIn URL" },
        { status: 404 }
      );
    }

    // Generate a stable email
    const vanity =
      extractLinkedInVanity(normalized) ||
      profile.slug ||
      String(profile._id);

    const generatedEmail = `${vanity}@linkedin.powerlist.local`;

    // Save email on the profile
    profile.email = generatedEmail;
    await profile.save();

    // Optional: also save the LinkedIn sub for future matching
    if (linkedinSub) {
      profile.linkedinSub = linkedinSub; // only if you add this field to the schema
      await profile.save();
    }

    return NextResponse.json({
      success: true,
      email: generatedEmail,
      name: profile.title,
      redirectTo: "/",
    });
  } catch (err: any) {
    console.error("[claim-profile]", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}