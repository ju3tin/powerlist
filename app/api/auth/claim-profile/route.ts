import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth"; // ← your auth file
import { connectDB } from "@/lib/mongodb";
import { normalizeLinkedInUrl, extractLinkedInVanity } from "@/lib/linkedin";

// ⚠️ CHANGE THIS to your real model
import ProfileModel from "@/models/Profile";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    // User must have gone through LinkedIn login first
    if (!session?.user) {
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
        { error: "Invalid LinkedIn URL. Example: https://www.linkedin.com/in/abbythomas/" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the Powerlist profile by LinkedIn URL
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

    // Generate a stable email so they can login next time
    const vanity =
      extractLinkedInVanity(normalized) ||
      profile.slug ||
      String(profile._id);

    const generatedEmail = `${vanity}@linkedin.powerlist.local`;

    // Save the email on the profile
    profile.email = generatedEmail;
    await profile.save();

    // Optional: also update a User collection if you have one
    // await UserModel.findOneAndUpdate(
    //   { /* match by LinkedIn sub or something */ },
    //   { email: generatedEmail, name: profile.title },
    //   { upsert: true }
    // );

    return NextResponse.json({
      success: true,
      email: generatedEmail,
      name: profile.title,
      redirectTo: "/", // ← change to your dashboard if needed
    });
  } catch (err: any) {
    console.error("[claim-profile]", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}