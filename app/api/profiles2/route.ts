import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Profile from "@/models/Profile";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    // =========================================================
    // QUERY PARAMETERS
    // =========================================================

    const search = searchParams.get("search");

    const title = searchParams.get("title");
    const slug = searchParams.get("slug");
    const category = searchParams.get("power_list_category");
    const artistTitle = searchParams.get("artist_title");
    const date = searchParams.get("date");
    const id = searchParams.get("id");

    // Social media filters
    const socialNetwork = searchParams.get("social_network");
    const socialUrl = searchParams.get("social_url");

    // =========================================================
    // BUILD QUERY
    // =========================================================

    const query: any = {};

    /*
     * GENERAL SEARCH
     *
     * Example:
     *
     * /api/profiles?search=anthony
     *
     * Searches:
     *
     * title
     * artist_title
     * content
     * slug
     * full_slug
     * link
     * power_list_category
     * social_icons.icon_type
     * social_icons.social_network_url
     */

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");

      query.$or = [
        // Basic profile fields
        { title: regex },
        { artist_title: regex },
        { content: regex },
        { slug: regex },
        { full_slug: regex },
        { link: regex },
        { power_list_category: regex },
        { featured_image: regex },
        { company_logo: regex },
        { count: regex },

        // Social media fields
        { "social_icons.icon_type": regex },
        { "social_icons.social_network_url": regex },
      ];
    }

    // =========================================================
    // INDIVIDUAL FILTERS
    // =========================================================

    if (title) {
      query.title = new RegExp(escapeRegex(title), "i");
    }

    if (slug) {
      query.slug = new RegExp(escapeRegex(slug), "i");
    }

    if (category) {
      query.power_list_category = new RegExp(
        escapeRegex(category),
        "i"
      );
    }

    if (artistTitle) {
      query.artist_title = new RegExp(
        escapeRegex(artistTitle),
        "i"
      );
    }

    if (date) {
      query.date = date;
    }

    // =========================================================
    // ID FILTER
    // =========================================================

    if (id) {
      const numericId = Number(id);

      if (Number.isNaN(numericId)) {
        return NextResponse.json(
          {
            error: "id must be a number",
          },
          { status: 400 }
        );
      }

      query.id = numericId;
    }

    // =========================================================
    // SOCIAL NETWORK FILTER
    // =========================================================
    //
    // Example:
    //
    // /api/profiles?social_network=linkedin
    //
    // Finds profiles containing:
    //
    // {
    //   "icon_type": "linkedin"
    // }
    //

    if (socialNetwork) {
      query.social_icons = {
        $elemMatch: {
          icon_type: new RegExp(
            escapeRegex(socialNetwork),
            "i"
          ),
        },
      };
    }

    // =========================================================
    // SOCIAL URL FILTER
    // =========================================================
    //
    // Example:
    //
    // /api/profiles?social_url=linkedin.com
    //
    // or:
    //
    // /api/profiles?social_url=anthony-eisen
    //

    if (socialUrl) {
      query.social_icons = {
        $elemMatch: {
          social_network_url: new RegExp(
            escapeRegex(socialUrl),
            "i"
          ),
        },
      };
    }

    // =========================================================
    // GET PROFILES
    // =========================================================

    const profiles = await Profile.find(query)
      .sort({ title: 1 })
      .lean()
      .exec();

    // Always return an array
    return NextResponse.json(
      Array.isArray(profiles) ? profiles : []
    );
  } catch (error: any) {
    console.error("GET /api/profiles error:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Failed to fetch profiles",
      },
      {
        status: 500,
      }
    );
  }
}

// =============================================================
// PATCH PROFILE
// =============================================================

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    const { _id, ...updates } = body;

    if (!_id) {
      return NextResponse.json(
        {
          error: "_id is required",
        },
        {
          status: 400,
        }
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
        {
          error: "Profile not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(profile);
  } catch (error: any) {
    console.error(
      "PATCH /api/profiles error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Failed to update profile",
      },
      {
        status: 500,
      }
    );
  }
}

// =============================================================
// ESCAPE REGEX
// =============================================================
//
// Prevents characters such as:
// . * + ? ^ $ ( ) [ ] { } | \
//
// in a search term from being interpreted as
// regular-expression operators.
//

function escapeRegex(value: string) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}
