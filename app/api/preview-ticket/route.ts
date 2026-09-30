import { generateTicketImage } from "@/lib/generateTicket"; // adjust path if needed
import { NextRequest, NextResponse } from "next/server";
import { toPngDataUrl } from "@/lib/toPngDataUrl";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const name = searchParams.get("name") || "Abby Thomas";
  const tokenId = searchParams.get("tokenId") || "001";
  const imageUrl = searchParams.get("imageUrl") || 'https://ww2.innovatefinance.com/wp-content/uploads/2024/04/abby-thomas.webp';

  let safeImageUrl: string | undefined;
  if (imageUrl) {
    try {
      safeImageUrl = await toPngDataUrl(imageUrl);
    } catch (err) {
      console.warn("Could not convert image, falling back to initials:", err);
      safeImageUrl = undefined;
    }
  }
  try {
    const buffer = await generateTicketImage({
      name,
      tokenId,
      imageUrl: imageUrl || undefined,
    });

    return new NextResponse(Buffer.from(buffer), {
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