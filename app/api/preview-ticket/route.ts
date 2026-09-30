import { generateTicketImage } from "@/lib/generateTicketImage2";
import { getTicketConfig } from "@/lib/getTicketConfig";
import type { TicketConfig } from "@/lib/ticketTypes";
import { NextRequest, NextResponse } from "next/server";

function clean(value?: string | null) {
  if (value == null) return undefined;
  const v = String(value).trim();
  if (!v || v === "false" || v === "undefined" || v === "null") return undefined;
  return v;
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
  /** If provided (admin POST), use this; else load from Mongo */
  config?: TicketConfig | null;
}) {
  // Admin POST can pass live config; public GET loads from DB
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
    config.height,
    "topBar:",
    config.showTopBar
  );

  return generateTicketImage({
    name: clean(input.name) || "Guest",
    tokenId: clean(input.tokenId) || "001",
    imageUrl: clean(input.imageUrl),
    role: clean(input.role) || "",
    category: clean(input.category) || "",
    year: clean(input.year) || "2026",
    companyLogo: clean(input.companyLogo),
    linkedinUrl: clean(input.linkedinUrl) || "",
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
      // no config → load from Mongo
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store", // avoid stale default template
      },
    });
  } catch (error: any) {
    console.error("GET /api/preview-ticket", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate ticket" },
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
      config: body.config ?? null, // admin sends live config
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("POST /api/preview-ticket", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate ticket" },
      { status: 500 }
    );
  }
}