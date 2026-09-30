import { generateTicketImage } from "@/lib/generateTicketImage2";
import type { TicketConfig } from "@/lib/ticketTypes";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name = "Allen Rohner",
      tokenId = "387640",
      imageUrl,
      role,
      category,
      year,
      companyLogo,
      linkedinUrl,
      config,
    } = body as {
      name?: string;
      tokenId?: string;
      imageUrl?: string;
      role?: string;
      category?: string;
      year?: string;
      companyLogo?: string;
      linkedinUrl?: string;
      config?: TicketConfig;
    };

    const buffer = await generateTicketImage({
      name,
      tokenId,
      imageUrl: imageUrl || undefined,
      role,
      category,
      year,
      companyLogo: companyLogo || undefined,
      linkedinUrl: linkedinUrl || undefined,
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