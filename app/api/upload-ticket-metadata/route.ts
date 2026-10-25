
import { NextRequest, NextResponse } from "next/server";
import { PinataSDK } from "pinata";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Selection = {
  profileId: string;
  name: string;
  jobTitle?: string;
  imageUrl?: string;
  companyLogo?: string;
  category?: string;
  year?: number;
  ticketConfig?: unknown;
};

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
});

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value.replace(/\/$/, "");
}

export async function POST(request: NextRequest) {
  try {
    const appUrl = getEnv("APP_URL");
    getEnv("PINATA_JWT");

    const body = await request.json().catch(() => null);
    const profileId = body?.profileId;

    if (
      typeof profileId !== "string" ||
      !/^[a-fA-F0-9]{24}$/.test(profileId)
    ) {
      return NextResponse.json(
        { error: "A valid profileId is required." },
        { status: 400 }
      );
    }

    // 1. Find the selection by profileId.
    const selectionsResponse = await fetch(
      `${appUrl}/api/nft-selections`,
      { cache: "no-store" }
    );

    if (!selectionsResponse.ok) {
      throw new Error("Could not retrieve NFT selections.");
    }

    const selectionsData = await selectionsResponse.json();

    const selection = (
      selectionsData.selections as Selection[] | undefined
    )?.find((item) => item.profileId === profileId);

    if (!selection) {
      return NextResponse.json(
        { error: "No selection found for this profileId." },
        { status: 404 }
      );
    }

    // 2. Generate the ticket PNG.
    // Adjust these fields if preview-ticket3 expects a different payload.
    const ticketResponse = await fetch(
      `${appUrl}/api/preview-ticket3`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          name: selection.name,
          jobTitle: selection.jobTitle,
          imageUrl: selection.imageUrl,
          companyLogo: selection.companyLogo,
          category: selection.category,
          ticketConfig: selection.ticketConfig,
        }),
      }
    );

    if (!ticketResponse.ok) {
      throw new Error(
        `Ticket generation failed (${ticketResponse.status}).`
      );
    }

    const contentType = ticketResponse.headers.get("content-type");

    if (!contentType?.includes("image/png")) {
      throw new Error("Ticket generator did not return a PNG image.");
    }

    const imageBuffer = await ticketResponse.arrayBuffer();

    if (imageBuffer.byteLength === 0) {
      throw new Error("Generated ticket image is empty.");
    }

    // 3. Upload the PNG to public IPFS via Pinata.
    const imageFile = new File(
      [imageBuffer],
      `powerlist-ticket-${profileId}.png`,
      { type: "image/png" }
    );

    const imageUpload = await pinata.upload.public
      .file(imageFile)
      .name(`Powerlist Ticket ${selection.name}`);

    const imageCid = imageUpload.cid;

    if (!imageCid) {
      throw new Error("Pinata did not return an image CID.");
    }

    // 4. Build the NFT metadata.
    const metadata = {
      name: `Innovate Finance Powerlist ${selection.year ?? 2026} - ${selection.name}`,
      description:
        "Innovate Finance Powerlist NFT ticket.",
      image: `ipfs://${imageCid}`,
      attributes: [
        {
          trait_type: "Category",
          value: selection.category ?? "",
        },
        {
          trait_type: "Job Title",
          value: selection.jobTitle ?? "",
        },
        {
          trait_type: "Year",
          value: selection.year ?? 2026,
        },
      ],
    };

    // 5. Upload metadata JSON to public IPFS.
    const metadataUpload = await pinata.upload.public
      .json(metadata)
      .name(`powerlist-metadata-${profileId}.json`);

    const metadataCid = metadataUpload.cid;

    if (!metadataCid) {
      throw new Error("Pinata did not return a metadata CID.");
    }

    // 6. Return the results.
    return NextResponse.json(
      {
        success: true,
        profileId,
        image: {
          cid: imageCid,
          uri: `ipfs://${imageCid}`,
          gatewayUrl: `https://ipfs.io/ipfs/${imageCid}`,
        },
        metadata: {
          cid: metadataCid,
          uri: `ipfs://${metadataCid}`,
          gatewayUrl: `https://ipfs.io/ipfs/${metadataCid}`,
          json: metadata,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Upload ticket metadata error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to upload ticket and metadata.",
      },
      { status: 500 }
    );
  }
}
