import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const APP_URL = process.env.APP_URL!;

export async function GET(request: NextRequest) {
  try {
    const profileId = request.nextUrl.searchParams.get("profileId");

    if (!profileId) {
      return NextResponse.json(
        { error: "Missing profileId" },
        { status: 400 }
      );
    }

    // Find the selection using profileId
    const selectionsResponse = await fetch(
      `${APP_URL}/api/nft-selections`,
      { cache: "no-store" }
    );

    if (!selectionsResponse.ok) {
      throw new Error("Failed to fetch NFT selections");
    }

    const data = await selectionsResponse.json();

    const selection = data.selections?.find(
      (item: { profileId: string }) =>
        item.profileId === profileId
    );

    if (!selection) {
      return NextResponse.json(
        { error: "Selection not found" },
        { status: 404 }
      );
    }

    // Generate the ticket image
    const imageResponse = await fetch(
      `${APP_URL}/api/preview-ticket3`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: selection.name,
          jobTitle: selection.jobTitle,
          imageUrl: selection.imageUrl,
          companyLogo: selection.companyLogo,
          category: selection.category,
          ticketConfig: selection.ticketConfig,
        }),
        cache: "no-store",
      }
    );

    if (!imageResponse.ok) {
      throw new Error("Failed to generate ticket image");
    }

    const imageBuffer = await imageResponse.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
        "Content-Disposition": "inline; filename=ticket.png",
      },
    });
  } catch (error) {
    console.error("Ticket preview error:", error);

    return NextResponse.json(
      { error: "Unable to generate ticket preview" },
      { status: 500 }
    );
  }
}