
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { generateTicketImage } from "@/lib/generateTicket";
import { PinataSDK } from "pinata";

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
 * ==========================================
 * NAME NORMALISATION
 * ==========================================
 */

function normalizeName(name: string) {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/*
 * ==========================================
 * GET POWERLIST PROFILES
 * ==========================================
 */

async function getProfiles(): Promise<Profile[]> {
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";

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

/*
 * ==========================================
 * SERVER-SIDE POWERLIST VERIFICATION
 * ==========================================
 */

async function verifyPowerlistProfile(): Promise<{
  firstName: string;
  lastName: string;
  fullName: string;
  profile: Profile;
} | null> {

  const cookieStore =
    await cookies();

  const firstNameCookie =
    cookieStore.get(
      "linkedin_first_name"
    );

  const lastNameCookie =
    cookieStore.get(
      "linkedin_last_name"
    );

  console.log(
    "🍪 linkedin_first_name exists:",
    Boolean(firstNameCookie)
  );

  console.log(
    "🍪 linkedin_last_name exists:",
    Boolean(lastNameCookie)
  );

  /*
   * Both cookies are required.
   */

  if (
    !firstNameCookie?.value ||
    !lastNameCookie?.value
  ) {
    console.error(
      "❌ LinkedIn name cookies missing"
    );

    return null;
  }

  const firstName =
    firstNameCookie.value.trim();

  const lastName =
    lastNameCookie.value.trim();

  const fullName =
    `${firstName} ${lastName}`
      .trim();

  const normalizedFullName =
    normalizeName(fullName);

  console.log(
    "👤 LinkedIn name from cookies:",
    fullName
  );

  /*
   * Get Powerlist profiles.
   */

  const profiles =
    await getProfiles();

  console.log(
    "📊 Profiles received:",
    profiles.length
  );

  /*
   * Match the complete name.
   */

  for (const profile of profiles) {

    if (!profile?.title) {
      continue;
    }

    const normalizedProfileName =
      normalizeName(
        profile.title
      );

    const matches =
      normalizedProfileName ===
      normalizedFullName;

    console.log(
      "🔎 Mint verification:",
      profile.title,
      "| Match:",
      matches
    );

    if (matches) {

      console.log(
        "✅ SERVER-SIDE PROFILE MATCH:",
        profile.title
      );

      return {
        firstName,
        lastName,
        fullName,
        profile,
      };
    }
  }

  console.error(
    "❌ No Powerlist profile found for:",
    fullName
  );

  return null;
}

/*
 * ==========================================
 * PINATA
 * ==========================================
 */

const pinata = new PinataSDK({
  pinataJwt:
    process.env.PINATA_JWT!,

  pinataGateway:
    process.env.PINATA_GATEWAY,
});

/*
 * ==========================================
 * POST /api/mint
 * ==========================================
 */

export async function POST(
  req: Request
) {

  console.log("");
  console.log(
    "=========================================="
  );
  console.log(
    "🪙 /api/mint"
  );
  console.log(
    "=========================================="
  );

  try {

    /*
     * ========================================
     * AUTH SESSION
     * ========================================
     */

    const session =
      await auth();

    if (
      !session?.user?.email
    ) {

      console.error(
        "❌ Mint rejected: unauthorized"
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    console.log(
      "✅ Authenticated:",
      session.user.email
    );

    /*
     * ========================================
     * REQUEST BODY
     * ========================================
     */

    let body: any = {};

    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const wallet =
      typeof body?.wallet === "string"
        ? body.wallet.trim()
        : "";

    const linkedinUrl =
      typeof body?.linkedinUrl === "string"
        ? body.linkedinUrl.trim()
        : "";

    if (!wallet) {

      console.error(
        "❌ Wallet address missing"
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Wallet address is required.",
        },
        {
          status: 400,
        }
      );
    }

    console.log(
      "💳 Wallet:",
      wallet
    );

    if (linkedinUrl) {
      console.log(
        "🔗 LinkedIn URL:",
        linkedinUrl
      );
    }

    /*
     * ========================================
     * SERVER-SIDE VERIFICATION
     * ========================================
     *
     * IMPORTANT:
     *
     * We completely ignore:
     *
     * body.name
     * body.verified
     * body.profile
     *
     * The user's identity comes from the
     * LinkedIn cookies.
     */

    console.log(
      "🔐 Performing server-side LinkedIn verification..."
    );

    const verification =
      await verifyPowerlistProfile();

    if (!verification) {

      console.error(
        "❌ Mint rejected: LinkedIn verification failed"
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Your LinkedIn name could not be matched to an Innovate Finance Powerlist profile.",
        },
        {
          status: 403,
        }
      );
    }

    const person =
      verification.profile;

    console.log(
      "=========================================="
    );

    console.log(
      "✅ POWERLIST VERIFIED"
    );

    console.log(
      "Name:",
      person.title
    );

    console.log(
      "Powerlist ID:",
      person.id
    );

    console.log(
      "=========================================="
    );

    /*
     * ========================================
     * GENERATE NFT IMAGE
     * ========================================
     */

    console.log(
      "🎨 Generating NFT image..."
    );

    const buffer =
      await generateTicketImage({
        name: person.title,

        tokenId:
          String(person.id),

        imageUrl:
          person.featured_image,
      });

    console.log(
      "✅ NFT image generated"
    );

    /*
     * ========================================
     * UPLOAD TO PINATA
     * ========================================
     */

    console.log(
      "📤 Uploading NFT image to Pinata..."
    );

    const file = new File(
      [Buffer.from(buffer)],
      `ticket-${person.id}.png`,
      {
        type: "image/png",
      }
    );

    const upload =
      await pinata.upload.public.file(
        file,
        {
          metadata: {

            name:
              `Powerlist Ticket – ${person.title}`,

            keyvalues: {

              name:
                person.title,

              email:
                session.user.email,

              linkedinFirstName:
                verification.firstName,

              linkedinLastName:
                verification.lastName,

              linkedinUrl,

              powerlistId:
                String(person.id),

              wallet,
            },
          },
        }
      );

    console.log(
      "✅ Pinata upload successful:",
      upload.cid
    );

    /*
     * ========================================
     * IMAGE URL
     * ========================================
     */

    const gateway =
      process.env.PINATA_GATEWAY ||
      "gateway.pinata.cloud";

    const imageUrl =
      `https://${gateway}/ipfs/${upload.cid}`;

    console.log(
      "🖼️ NFT image:",
      imageUrl
    );

    /*
     * ========================================
     * RESPONSE
     * ========================================
     *
     * If you already have your Avalanche
     * contract minting code, put it here.
     */

    console.log("");
    console.log(
      "=========================================="
    );

    console.log(
      "✅ NFT ASSET CREATED"
    );

    console.log(
      "=========================================="
    );

    return NextResponse.json({

      success: true,

      name:
        person.title,

      powerlistId:
        person.id,

      image:
        imageUrl,

      cid:
        upload.cid,

      url:
        imageUrl,

      wallet,

      message:
        "LinkedIn profile verified and NFT asset created successfully.",
    });

  } catch (error: any) {

    console.error(
      "💥 /api/mint error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "NFT mint failed.",
      },
      {
        status: 500,
      }
    );
  }
}
