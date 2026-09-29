
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Profile from "@/models/Profile";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    // General search
    const search = searchParams.get("search");

    // Individual filters
    const title = searchParams.get("title");
    const slug = searchParams.get("slug");
    const category = searchParams.get("power_list_category");
    const artistTitle = searchParams.get("artist_title");
    const date = searchParams.get("date");
    const id = searchParams.get("id");

    // Build MongoDB query
    const query: any = {};

    /*
     * General search across multiple fields
     *
     * Example:
     * /api/profiles?search=aadit
     *
     * Searches:
     * title
     * artist_title
     * content
     * slug
     * full_slug
     * link
     * power_list_category
     */
    if (search) {
      const regex = new RegExp(search, "i");

      query.$or = [
        { title: regex },
        { artist_title: regex },
        { content: regex },
        { slug: regex },
        { full_slug: regex },
        { link: regex },
        { power_list_category: regex },
      ];
    }

    // Individual filters
    if (title) {
      query.title = new RegExp(title, "i");
    }

    if (slug) {
      query.slug = new RegExp(slug, "i");
    }

    if (category) {
      query.power_list_category = new RegExp(category, "i");
    }

    if (artistTitle) {
      query.artist_title = new RegExp(artistTitle, "i");
    }

    if (date) {
      query.date = date;
    }

    if (id) {
      query.id = Number(id);
    }

    // Get matching profiles
    const profiles = await Profile.find(query)
      .sort({ title: 1 })
      .lean()
      .exec();

    return NextResponse.json(profiles);
  } catch (error: any) {
    console.error("GET /api/profiles error:", error);

    return NextResponse.json(
      {
        error: error.message || "Failed to fetch profiles",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { _id, ...updates } = body;

    if (!_id) {
      return NextResponse.json(
        { error: "_id is required" },
        { status: 400 }
      );
    }

    const profile = await Profile.findByIdAndUpdate(
      _id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    )
      .lean()
      .exec();

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error: any) {
    console.error("PATCH /api/profiles error:", error);

    return NextResponse.json(
      {
        error: error.message || "Failed to update profile",
      },
      { status: 500 }
    );
  }
}
