import { generateTicketImage, type TicketConfig } from "@/lib/generateTicket";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name = "Abby Thomas",
      tokenId = "001",
      imageUrl,
      config = {},
    } = body as {
      name?: string;
      tokenId?: string;
      imageUrl?: string;
      config?: TicketConfig;
    };

    const buffer = await generateTicketImage({
      name,
      tokenId,
      imageUrl: imageUrl || undefined,
      config,
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || "Failed to generate ticket" },
      { status: 500 }
    );
  }
}

// Optional: keep GET for simple query-param testing
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name") || "Abby Thomas";
    const tokenId = searchParams.get("tokenId") || "001";
    const imageUrl = searchParams.get("imageUrl") || undefined;

    const buffer = await generateTicketImage({
      name,
      tokenId,
      imageUrl: imageUrl || undefined,
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || "Failed to generate ticket" },
      { status: 500 }
    );
  }
}