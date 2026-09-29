import { cookies } from "next/headers";
import { NextResponse } from "next/server";

interface Profile {
  _id?: string;
  id: number;
  title: string;
  artist_title?: string;
  featured_image?: string;
  social_icons?: {
    icon_type?: string;
    social_network_url?: string;
  }[];
}

/*
 * Clean a name before comparing it.
 *
 * "Aadit Gandhi"
 * "aadit gandhi"
 *
 * become the same value.
 */
function normalizeName(name: string) {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/*
 * Get the profiles from /api/profiles.
 */
async function getProfiles(): Promise<Profile[]> {
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://powerlist-nine.vercel.ap";

  console.log(
    "📡 Fetching profiles from:",
    baseUrl
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
    throw new Error(
      `Profiles API returned ${response.status}`
    );
  }

  const data = await response.json();

  if (
    !data?.success ||
    !Array.isArray(data.data)
  ) {
    throw new Error(
      "Invalid profiles API response"
    );
  }

  return data.data;
}

export async function POST(req: Request) {
  console.log("");
  console.log(
    "=========================================="
  );
  console.log(
    "🔍 /api/verify"
  );
  console.log(
    "=========================================="
  );

  try {
    /*
     * ==========================================
     * READ COOKIES
     * ==========================================
     */

    const cookieStore = await cookies();

    const firstNameCookie =
      cookieStore.get(
        "linkedin_first_name"
      );

    const lastNameCookie =
      cookieStore.get(
        "linkedin_last_name"
      );

    /*
     * We don't log the actual cookie values.
     */
    console.log(
      "🍪 linkedin_first_name exists:",
      Boolean(firstNameCookie)
    );

    console.log(
      "🍪 linkedin_last_name exists:",
      Boolean(lastNameCookie)
    );

    if (
      !firstNameCookie?.value ||
      !lastNameCookie?.value
    ) {
      console.error(
        "❌ LinkedIn name cookies missing"
      );

      return NextResponse.json(
        {
          success: false,
          verified: false,
          error:
            "LinkedIn name information was not found. Please login with LinkedIn again.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * ==========================================
     * GET LINKEDIN NAME
     * ==========================================
     */

    const linkedinFirstName =
      firstNameCookie.value
        .trim();

    const linkedinLastName =
      lastNameCookie.value
        .trim();

    const linkedinFullName =
      `${linkedinFirstName} ${linkedinLastName}`
        .trim();

    const normalizedLinkedInName =
      normalizeName(
        linkedinFullName
      );

    console.log(
      "👤 LinkedIn full name:",
      linkedinFullName
    );

    console.log(
      "🔎 Normalized LinkedIn name:",
      normalizedLinkedInName
    );

    /*
     * ==========================================
     * READ REQUEST
     * ==========================================
     *
     * LinkedIn URL is no longer needed for
     * matching.
     *
     * We accept it so the frontend can still
     * send/store/display it if required.
     */

    let body: any = {};

    try {
      body = await req.json();
    } catch {
      body = {};
    }

    if (body?.linkedinUrl) {
      console.log(
        "🔗 LinkedIn URL supplied:",
        body.linkedinUrl
      );
    }

    /*
     * ==========================================
     * GET POWERLIST PROFILES
     * ==========================================
     */

    const profiles =
      await getProfiles();

    console.log(
      "📊 Profiles received:",
      profiles.length
    );

    /*
     * ==========================================
     * MATCH NAME
     * ==========================================
     */

    let matchedProfile:
      | Profile
      | null = null;

    for (const profile of profiles) {
      if (!profile?.title) {
        continue;
      }

      const normalizedProfileName =
        normalizeName(
          profile.title
        );

      const nameMatches =
        normalizedProfileName ===
        normalizedLinkedInName;

      console.log(
        "🔎 Checking:",
        profile.title,
        "| Match:",
        nameMatches
      );

      if (nameMatches) {
        matchedProfile =
          profile;

        console.log(
          "✅ PROFILE MATCH FOUND:",
          profile.title
        );

        break;
      }
    }

    /*
     * ==========================================
     * NO MATCH
     * ==========================================
     */

    if (!matchedProfile) {
      console.log(
        "❌ No Powerlist profile matched:",
        linkedinFullName
      );

      return NextResponse.json(
        {
          success: false,
          verified: false,
          error:
            `No Innovate Finance Powerlist profile was found for ${linkedinFullName}.`,
        },
        {
          status: 403,
        }
      );
    }

    /*
     * ==========================================
     * SUCCESS
     * ==========================================
     */

    console.log("");
    console.log(
      "=========================================="
    );
    console.log(
      "✅ VERIFICATION SUCCESS"
    );
    console.log(
      "=========================================="
    );

    return NextResponse.json({
      success: true,
      verified: true,

      linkedinFirstName,
      linkedinLastName,
      linkedinFullName,

      profile: matchedProfile,
    });

  } catch (error) {
    console.error(
      "💥 /api/verify error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        verified: false,
        error:
          "An error occurred while verifying your LinkedIn profile.",
      },
      {
        status: 500,
      }
    );
  }
}
