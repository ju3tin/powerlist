
import { generateTicketImage } from "@/lib/generateTicketImage2";
import { getTicketConfig } from "@/lib/getTicketConfig";
import type { TicketConfig } from "@/lib/ticketTypes";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

function clean(value?: string | null): string | undefined {
  if (value == null) return undefined;

  const v = String(value).trim();

  if (
    !v ||
    v === "false" ||
    v === "undefined" ||
    v === "null" ||
    v.toLowerCase() === "cancel"
  ) {
    return undefined;
  }

  return v;
}

/**
 * Converts remote WebP images to PNG data URLs.
 * Other image URLs are left unchanged.
 */
async function normalizeImageUrl(
  imageUrl?: string | null
): Promise<string | undefined> {
  const url = clean(imageUrl);
  if (!url) return undefined;

  // Only convert WebP URLs. Query strings are supported.
  if (!/\.webp(?:$|[?#])/i.test(url)) {
    return url;
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch WebP image (${response.status}): ${url}`
    );
  }

  const input = Buffer.from(await response.arrayBuffer());

  const png = await sharp(input).png().toBuffer();
  const base64 = png.toString("base64");

  return `data:image/png;base64,${base64}`;
}

async function buildTicket(input: {
  name?: string | null;
  tokenId?: string | null;
  imageUrl?: string | null;
  role?: string | null;
  category?: string | null;
  year?: string | null;
  companyLogo?: string | null;
  linkedinUrl?: string | null;
  config?: TicketConfig | null;
}) {
  const config =
    input.config &&
    Array.isArray(input.config.layers) &&
    input.config.background
      ? input.config
      : await getTicketConfig();

  console.log(
    "[preview-ticket] layers:",
    config.layers?.length,
    "size:",
    config.width,
    "x",
    config.height
  );

  const imageUrl = await normalizeImageUrl(input.imageUrl);
  const companyLogo = await normalizeImageUrl(input.companyLogo);

  return generateTicketImage({
    name: clean(input.name) ?? "Guest",
    tokenId: clean(input.tokenId) ?? "001",
    imageUrl,
    role: clean(input.role) ?? "",
    category: clean(input.category) ?? "",
    year: clean(input.year) ?? "2026",
    companyLogo,
    linkedinUrl: clean(input.linkedinUrl) ?? "",
    config,
  });
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;

    const buffer = await buildTicket({
      name: sp.get("name"),
      tokenId: sp.get("tokenId"),
      imageUrl: sp.get("imageUrl"),
      role: sp.get("role"),
      category: sp.get("category"),
      year: sp.get("year"),
      companyLogo: sp.get("companyLogo"),
      linkedinUrl: sp.get("linkedinUrl"),
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    console.error("GET /api/preview-ticket", error);

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const buffer = await buildTicket({
      name: body.name,
      tokenId: body.tokenId,
      imageUrl: body.imageUrl,
      role: body.role,
      category: body.category,
      year: body.year,
      companyLogo: body.companyLogo,
      linkedinUrl: body.linkedinUrl,
      config: body.config ?? null,
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    console.error("POST /api/preview-ticket", error);

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
