import { cookies } from "next/headers";
import { NextResponse } from "next/server";

interface SocialIcon {
  icon_type?: string;
  social_network_url?: string;
}

interface Profile {
  _id?: string;
  id: number;
  title: string;
  artist_title?: string;
  featured_image?: string;
  social_icons?: SocialIcon[];
}

function normalizeLinkedInUrl(url: string) {
  return url
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
}

/*
 * Extract the last name from a profile title.
 *
 * Examples:
 *
 * "Abby Thomas"       -> "thomas"
 * "Aadit Gandhi"      -> "gandhi"
 * "John Smith Jones"  -> "jones"
 */
function getLastName(name: string) {
  const cleaned = name
    .trim()
    .replace(/\s+/g, " ");

  const parts = cleaned.split(" ");

  return parts[parts.length - 1]
    .replace(/[^a-zA-ZÀ-ÿ'-]/g, "")
    .toLowerCase();
}

async function getProfiles(): Promise<Profile[]> {
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";

  console.log("📡 Fetching profiles from:", baseUrl);

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
  console.log("==========================================");
  console.log("🔍 /api/verify");
  console.log("==========================================");

  try {
    /*
     * ==========================================
     * READ LINKEDIN LAST NAME COOKIE
     * ==========================================
     */

    const cookieStore = await cookies();

    const linkedinLastNameCookie =
      cookieStore.get(
        "linkedin_last_name"
      );

    const linkedinLastName =
      linkedinLastNameCookie?.value
        ?.trim()
        .toLowerCase();

    console.log(
      "🍪 linkedin_last_name cookie exists:",
      Boolean(linkedinLastNameCookie)
    );

    /*
     * DO NOT log the actual cookie value in production.
     *
     * We log only whether it exists.
     */
    if (!linkedinLastName) {
      console.error(
        "❌ linkedin_last_name cookie missing"
      );

      return NextResponse.json(
        {
          success: false,
          verified: false,
          error:
            "LinkedIn last name cookie was not found. Please login with LinkedIn again.",
        },
        { status: 401 }
      );
    }

    /*
     * ==========================================
     * READ REQUEST
     * ==========================================
     */

    const body = await req.json();

    const linkedinUrl =
      typeof body?.linkedinUrl === "string"
        ? body.linkedinUrl.trim()
        : "";

    if (!linkedinUrl) {
      console.error(
        "❌ No LinkedIn URL supplied"
      );

      return NextResponse.json(
        {
          success: false,
          verified: false,
          error:
            "LinkedIn profile URL is required.",
        },
        { status: 400 }
      );
    }

    const normalizedInputUrl =
      normalizeLinkedInUrl(linkedinUrl);

    console.log(
      "🔗 Normalized LinkedIn URL:",
      normalizedInputUrl
    );

    /*
     * ==========================================
     * GET POWERLIST PROFILES
     * ==========================================
     */

    const profiles = await getProfiles();

    console.log(
      "📊 Profiles received:",
      profiles.length
    );

    /*
     * ==========================================
     * FIND MATCH
     * ==========================================
     */

    let matchedProfile: Profile | null =
      null;

    for (const profile of profiles) {
      if (!profile?.title) {
        continue;
      }

      const profileLastName =
        getLastName(profile.title);

      const linkedinIcon =
        profile.social_icons?.find(
          (social) =>
            social.icon_type
              ?.trim()
              .toLowerCase() ===
              "linkedin"
        );

      const profileLinkedInUrl =
        linkedinIcon?.social_network_url
          ? normalizeLinkedInUrl(
              linkedinIcon.social_network_url
            )
          : "";

      const lastNameMatches =
        profileLastName ===
        linkedinLastName;

      const linkedinMatches =
        profileLinkedInUrl ===
        normalizedInputUrl;

      console.log(
        "Checking profile:",
        profile.title,
        {
          lastNameMatches,
          linkedinMatches,
          hasLinkedIn:
            Boolean(profileLinkedInUrl),
        }
      );

      /*
       * BOTH conditions must match.
       */
      if (
        lastNameMatches &&
        linkedinMatches
      ) {
        matchedProfile = profile;

        console.log(
          "✅ MATCH FOUND:",
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
        "❌ No matching Powerlist profile"
      );

      return NextResponse.json(
        {
          success: false,
          verified: false,
          error:
            "We could not find a Powerlist profile matching your LinkedIn information.",
        },
        { status: 403 }
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

      /*
       * Return the surname for UI/debugging.
       * Do not return the raw cookie.
       */
      linkedinLastName,

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
      { status: 500 }
    );
  }
}
