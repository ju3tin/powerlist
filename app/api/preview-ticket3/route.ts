
import { generateTicketImage } from "@/lib/generateTicketImage2";
import { getTicketConfig } from "@/lib/getTicketConfig";
import type { TicketConfig } from "@/lib/ticketTypes";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cleans values that should be ignored.
 */
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
 * Downloads an image and converts it to a PNG data URL.
 *
 * Detects the actual image format from its bytes instead of
 * relying on the file extension. Supports WebP and other formats
 * supported by Sharp.
 */
async function normalizeImageUrl(
  imageUrl?: string | null
): Promise<string | undefined> {
  const url = clean(imageUrl);

  if (!url) return undefined;

  // Handle existing image data URLs.
  if (url.startsWith("data:")) {
    const match = url.match(
      /^data:image\/[^;,]+;base64,([\s\S]+)$/
    );

    if (!match) {
      throw new Error("Invalid image data URL");
    }

    const input = Buffer.from(match[1], "base64");

    return await convertToPngDataUrl(input, "data URL");
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error(`Invalid image URL: ${url}`);
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Image URL must use HTTP or HTTPS");
  }

  const response = await fetch(parsedUrl.toString(), {
    headers: {
      Accept: "image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.8",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    throw new Error(
      `Image download failed: HTTP ${response.status} ${response.statusText}`
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  const input = Buffer.from(await response.arrayBuffer());

  if (input.length === 0) {
    throw new Error("Downloaded image is empty");
  }

  console.log("[preview-ticket] Downloaded image:", {
    contentType,
    bytes: input.length,
    url: parsedUrl.hostname,
  });

  return convertToPngDataUrl(input, contentType);
}

/**
 * Validates the image and converts it to a PNG data URL.
 */
async function convertToPngDataUrl(
  input: Buffer,
  source: string
): Promise<string> {
  try {
    const metadata = await sharp(input).metadata();

    console.log("[preview-ticket] Image format detected:", {
      source,
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
    });

    const png = await sharp(input)
      .rotate()
      .png()
      .toBuffer();

    return `data:image/png;base64,${png.toString("base64")}`;
  } catch (error) {
    console.error("[preview-ticket] Image conversion failed:", {
      source,
      bytes: input.length,
      signature: input.subarray(0, 16).toString("hex"),
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });

    throw new Error(
      `Unable to decode image (${source}). Check that the URL returns actual image bytes and that Sharp supports the image format.`
    );
  }
}

/**
 * Generates the ticket.
 */
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

  console.log("[preview-ticket] Ticket config:", {
    layers: config.layers?.length,
    width: config.width,
    height: config.height,
    showTopBar: config.showTopBar,
  });

  // Normalize the incoming profile photo and company logo.
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

/**
 * GET /api/preview-ticket
 */
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
    console.error("GET /api/preview-ticket failed:", error);

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

/**
 * POST /api/preview-ticket
 */
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
    console.error("POST /api/preview-ticket failed:", error);

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
