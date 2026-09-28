import { NextResponse } from "next/server";
import { generateAndUploadTicket } from "@/lib/generateAndUploadTicket";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const name = searchParams.get("name");
    const tokenId = searchParams.get("tokenId") || "001";
    const imageUrl = searchParams.get("imageUrl") || undefined;

    if (!name) {
      return NextResponse.json(
        {
          error: "Name is required",
        },
        {
          status: 400,
        }
      );
    }

    // Generate PNG + upload to Pinata
    const result = await generateAndUploadTicket({
      name,
      tokenId,
      imageUrl,
    });

    return NextResponse.json({
      success: true,
      cid: result.cid,
      url: result.url,
    });
  } catch (error) {
    console.error("Ticket generation/upload error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate and upload ticket",
      },
      {
        status: 500,
      }
    );
  }
}