import { generateTicketImage } from "@/lib/generateTicketImage2";
import { getTicketConfig } from "@/lib/getTicketConfig";
import type { TicketConfig } from "@/lib/ticketTypes";
import { NextRequest, NextResponse } from "next/server";

async function buildTicket(input: {
  name?: string;
  tokenId?: string;
  imageUrl?: string;
  role?: string;
  category?: string;
  year?: string;
  companyLogo?: string;
  linkedinUrl?: string;
  config?: TicketConfig | null;
}) {
  const saved = input.config ?? (await getTicketConfig());

  const buffer = await generateTicketImage({
    name: input.name || "Guest",
    tokenId: input.tokenId || "001",
    imageUrl: input.imageUrl || undefined,
    role: input.role || "",
    category: input.category || "",
    year: input.year || "2026",
    companyLogo: input.companyLogo || undefined,
    linkedinUrl: input.linkedinUrl || "",
    config: saved ?? undefined,
  });

  return buffer;
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;

    const buffer = await buildTicket({
      name: sp.get("name") || undefined,
      tokenId: sp.get("tokenId") || undefined,
      imageUrl: sp.get("imageUrl") || undefined,
      role: sp.get("role") || undefined,
      category: sp.get("category") || undefined,
      year: sp.get("year") || undefined,
      companyLogo: sp.get("companyLogo") || undefined,
      linkedinUrl: sp.get("linkedinUrl") || undefined,
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=60",
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      tokenId,
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

    const buffer = await buildTicket({
      name,
      tokenId,
      imageUrl,
      role,
      category,
      year,
      companyLogo,
      linkedinUrl,
      config: config ?? null,
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