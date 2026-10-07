import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Profile from "@/models/Profile";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    await connectDB();

    // --------------------------------------------------
    // BASIC VALIDATION
    // --------------------------------------------------

    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Profile ID is required",
        },
        { status: 400 }
      );
    }

    if (!body.title) {
      return NextResponse.json(
        {
          success: false,
          error: "Title is required",
        },
        { status: 400 }
      );
    }

    if (!body.slug) {
      return NextResponse.json(
        {
          success: false,
          error: "Slug is required",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // EMAIL
    // --------------------------------------------------

    const email = body.email
      ? String(body.email).trim().toLowerCase()
      : "";

    // --------------------------------------------------
    // CHECK DUPLICATE ID
    // --------------------------------------------------

    const existingId = await Profile.findOne({
      id: Number(body.id),
    });

    if (existingId) {
      return NextResponse.json(
        {
          success: false,
          error: `Profile ID ${body.id} already exists`,
          code: "DUPLICATE_PROFILE_ID",
        },
        { status: 409 }
      );
    }

    // --------------------------------------------------
    // CHECK DUPLICATE SLUG
    // --------------------------------------------------

    const existingSlug = await Profile.findOne({
      slug: body.slug,
    });

    if (existingSlug) {
      return NextResponse.json(
        {
          success: false,
          error: `Slug "${body.slug}" already exists`,
          code: "DUPLICATE_SLUG",
        },
        { status: 409 }
      );
    }

    // --------------------------------------------------
    // CHECK DUPLICATE EMAIL
    // --------------------------------------------------

    if (email) {
      const existingEmail = await Profile.findOne({
        email,
      });

      if (existingEmail) {
        return NextResponse.json(
          {
            success: false,
            error:
              "This email address is already registered on the Powerlist.",
            code: "DUPLICATE_EMAIL",
            profile: {
              id: existingEmail.id,
              title: existingEmail.title,
              email: existingEmail.email,
              slug: existingEmail.slug,
            },
          },
          { status: 409 }
        );
      }
    }

    // --------------------------------------------------
    // OTHER
    //
    // Do NOT accept other from the browser.
    // Every profile created through this API is
    // automatically marked as unverified.
    // --------------------------------------------------

    const other = [
      {
        other_type: "verification_status",
        other_type_value: "unverified",
      },
    ];

    // --------------------------------------------------
    // CREATE PROFILE
    // --------------------------------------------------

    const profile = await Profile.create({
      id: Number(body.id),

      title: body.title,

      email,

      artist_title: body.artist_title || "",

      date: body.date || "",

      content: body.content || "",

      slug: body.slug,

      featured_image: body.featured_image || "",

      power_list_category:
        body.power_list_category || "",

      link: body.link || "",

      social_icons:
        Array.isArray(body.social_icons)
          ? body.social_icons
          : [],

      // Automatically added
      other,

      count: body.count || "",

      company_logo: body.company_logo || "",

      full_slug: body.full_slug || "",
    });

    // --------------------------------------------------
    // SUCCESS
    // --------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        message:
          "Profile created successfully as unverified.",
        profile,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(
      "Create profile error:",
      error
    );

    // Mongo duplicate-key protection
    if (error?.code === 11000) {
      const duplicateField =
        Object.keys(error?.keyPattern || {})[0];

      if (duplicateField === "email") {
        return NextResponse.json(
          {
            success: false,
            error:
              "This email address is already registered on the Powerlist.",
            code: "DUPLICATE_EMAIL",
          },
          { status: 409 }
        );
      }

      if (duplicateField === "id") {
        return NextResponse.json(
          {
            success: false,
            error:
              "This Profile ID already exists.",
            code: "DUPLICATE_PROFILE_ID",
          },
          { status: 409 }
        );
      }

      if (duplicateField === "slug") {
        return NextResponse.json(
          {
            success: false,
            error:
              "This slug already exists.",
            code: "DUPLICATE_SLUG",
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Failed to create profile",
      },
      { status: 500 }
    );
  }
}
