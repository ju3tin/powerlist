import { NextResponse } from "next/server";

interface Profile {
  _id?: string;
  id: number;
  __v?: number;
  artist_title?: string;
  content?: string;
  count?: string;
  createdAt?: string;
  date?: string;
  featured_image?: string;
  full_slug?: string;
  link?: string;
  power_list_category?: string;
  slug?: string;
  social_icons?: {
    icon_type?: string;
    social_network_url?: string;
  }[];
  title: string;
  updatedAt?: string;
}

function normalizeName(name: string) {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export async function GET(req: Request) {
  console.log("");
  console.log("==========================================");
  console.log("🔍 GET /api/profile");
  console.log("==========================================");

  try {
    /*
     * Get query parameters
     *
     * Example:
     *
     * /api/profile?name=Aadit%20Gandhi
     *
     */

    const { searchParams } =
      new URL(req.url);

    const name =
      searchParams.get("name");

    const slug =
      searchParams.get("slug");

    /*
     * Require either name or slug
     */

    if (!name && !slug) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please provide either ?name= or ?slug=",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ==========================================
     * GET /api/profiles
     * ==========================================
     */

    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    console.log(
      "📡 Querying:",
      `${baseUrl}/api/profiles`
    );

    const response = await fetch(
      `${baseUrl}/api/profiles`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    console.log(
      "📡 /api/profiles status:",
      response.status
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to retrieve profiles.",
        },
        {
          status: 502,
        }
      );
    }

    const data =
      await response.json();

    if (
      !data?.success ||
      !Array.isArray(data.data)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid response from /api/profiles.",
        },
        {
          status: 502,
        }
      );
    }

    const profiles =
      data.data as Profile[];

    console.log(
      "📊 Profiles received:",
      profiles.length
    );

    /*
     * ==========================================
     * FIND BY NAME
     * ==========================================
     */

    if (name) {
      const normalizedSearchName =
        normalizeName(name);

      console.log(
        "🔎 Searching name:",
        normalizedSearchName
      );

      const profile =
        profiles.find(
          (item) =>
            normalizeName(
              item.title
            ) === normalizedSearchName
        );

      if (!profile) {
        console.log(
          "❌ Profile not found:",
          name
        );

        return NextResponse.json(
          {
            success: false,
            found: false,
            error:
              `No profile found for "${name}".`,
          },
          {
            status: 404,
          }
        );
      }

      console.log(
        "✅ Profile found:",
        profile.title
      );

      return NextResponse.json({
        success: true,
        found: true,
        data: profile,
      });
    }

    /*
     * ==========================================
     * FIND BY SLUG
     * ==========================================
     */

    if (slug) {
      const normalizedSlug =
        slug
          .trim()
          .toLowerCase()
          .replace(/^\/+|\/+$/g, "");

      console.log(
        "🔎 Searching slug:",
        normalizedSlug
      );

      const profile =
        profiles.find(
          (item) =>
            item.slug
              ?.trim()
              .toLowerCase() ===
            normalizedSlug
        );

      if (!profile) {
        console.log(
          "❌ Profile not found:",
          slug
        );

        return NextResponse.json(
          {
            success: false,
            found: false,
            error:
              `No profile found for "${slug}".`,
          },
          {
            status: 404,
          }
        );
      }

      console.log(
        "✅ Profile found:",
        profile.title
      );

      return NextResponse.json({
        success: true,
        found: true,
        data: profile,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "No search supplied.",
      },
      {
        status: 400,
      }
    );

  } catch (error) {
    console.error(
      "💥 /api/profile error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Internal server error.",
      },
      {
        status: 500,
      }
    );
  }
}
