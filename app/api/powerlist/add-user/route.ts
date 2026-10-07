import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Profile from "@/models/Profile";

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function getUniqueSlug(baseSlug: string) {
  let slug = baseSlug || "powerlist-profile";
  let counter = 1;

  while (await Profile.exists({ slug })) {
    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  return slug;
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    console.log("POWERLIST ADD USER:", body);

    const {
      title,
      email,
      artist_title,
      date,
      featured_image,
      power_list_category,
      link,
      social_icons,
      count,
      company_logo,
      full_slug,
      other,
    } = body;

    if (!title || !String(title).trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Name is required",
        },
        { status: 400 }
      );
    }

    if (!email || !String(email).trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Email address is required",
        },
        { status: 400 }
      );
    }

    if (!artist_title || !String(artist_title).trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Job title is required",
        },
        { status: 400 }
      );
    }

    if (
      !power_list_category ||
      !String(power_list_category).trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Powerlist category is required",
        },
        { status: 400 }
      );
    }

    // Check whether this email already exists
    const existingEmail = await Profile.findOne({
      email: String(email).trim().toLowerCase(),
    }).lean();

    if (existingEmail) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A Powerlist profile already exists for this email address.",
        },
        { status: 409 }
      );
    }

    // Generate a unique numeric ID
    const lastProfile = await Profile.findOne()
      .sort({ id: -1 })
      .select("id")
      .lean();

    const lastId = Number(lastProfile?.id);

    const newId =
      Number.isFinite(lastId) && lastId > 0
        ? lastId + 1
        : 1;

    // Generate unique slug
    const baseSlug = makeSlug(String(title));

    const slug = await getUniqueSlug(baseSlug);

    // Existing other values
    const profileOther = Array.isArray(other)
      ? other.filter(
          (item: any) =>
            item &&
            item.other_type &&
            item.other_type_value
        )
      : [];

    // Always mark applications as unverified
    profileOther.push({
      other_type: "verification_status",
      other_type_value: "unverified",
    });

    const profile = await Profile.create({
      id: newId,

      title: String(title).trim(),

      email: String(email)
        .trim()
        .toLowerCase(),

      artist_title: artist_title
        ? String(artist_title).trim()
        : undefined,

      date: date
        ? String(date).trim()
        : undefined,

      slug,

      featured_image: featured_image
        ? String(featured_image).trim()
        : undefined,

      power_list_category: power_list_category
        ? String(power_list_category).trim()
        : undefined,

      link: link
        ? String(link).trim()
        : undefined,

      social_icons: Array.isArray(social_icons)
        ? social_icons
        : [],

      other: profileOther,

      count: count
        ? String(count).trim()
        : undefined,

      company_logo: company_logo
        ? String(company_logo).trim()
        : undefined,

      full_slug: full_slug
        ? String(full_slug).trim()
        : slug,
    });

    console.log(
      "POWERLIST USER CREATED:",
      profile._id
    );

    return NextResponse.json(
      {
        success: true,
        message:
          "User added to the Powerlist as unverified",
        profile,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(
      "POWERLIST ADD USER ERROR:",
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