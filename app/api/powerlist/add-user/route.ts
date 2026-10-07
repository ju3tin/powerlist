import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Profile from "@/models/Profile";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    const {
      title,
      email,
      artist_title,
      date,
      slug,
      featured_image,
      power_list_category,
      link,
      social_icons,
      count,
      company_logo,
      full_slug,
      other,
    } = body;

    // Required fields
    if (!title) {
      return NextResponse.json(
        {
          success: false,
          error: "Name/title is required",
        },
        { status: 400 }
      );
    }

    // Generate slug if one wasn't supplied
    const generatedSlug =
      slug ||
      title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    // Check slug
    const existingSlug = await Profile.findOne({
      slug: generatedSlug,
    });

    if (existingSlug) {
      return NextResponse.json(
        {
          success: false,
          error: "A profile with this slug already exists",
        },
        { status: 409 }
      );
    }

    // Generate unique numeric ID
    const lastProfile = await Profile.findOne()
      .sort({ id: -1 })
      .select("id")
      .lean();

    const newId = lastProfile?.id
      ? Number(lastProfile.id) + 1
      : 1;

    // Make sure unverified status is stored in `other`
    const existingOther = Array.isArray(other)
      ? other
      : [];

    const hasVerificationStatus = existingOther.some(
      (item: any) =>
        item?.other_type === "verification_status"
    );

    const profileOther = hasVerificationStatus
      ? existingOther
      : [
          ...existingOther,
          {
            other_type: "verification_status",
            other_type_value: "unverified",
          },
        ];

    const profile = await Profile.create({
      id: newId,
      title,
      email: email || undefined,
      artist_title: artist_title || undefined,
      date: date || undefined,
      slug: generatedSlug,
      featured_image: featured_image || undefined,
      power_list_category:
        power_list_category || undefined,
      link: link || undefined,
      social_icons: Array.isArray(social_icons)
        ? social_icons
        : [],
      other: profileOther,
      count: count || undefined,
      company_logo: company_logo || undefined,
      full_slug: full_slug || generatedSlug,
    });

    return NextResponse.json(
      {
        success: true,
        message: "User added to the Powerlist as unverified",
        profile,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(
      "POST /api/powerlist/add-user error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Failed to add user to Powerlist",
      },
      { status: 500 }
    );
  }
}