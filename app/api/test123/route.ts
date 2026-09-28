import { NextResponse } from "next/server";
import { generateTicketImage } from "@/lib/generateTicket";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { name, tokenId, imageUrl } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const result = await generateTicketImage({
      name,
      tokenId: tokenId || "001",
      imageUrl,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Ticket generation error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate ticket",
      },
      { status: 500 }
    );
  }
}
