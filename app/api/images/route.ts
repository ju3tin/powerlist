import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const imagesDir = path.join(process.cwd(), "public", "images");

    if (!fs.existsSync(imagesDir)) {
      return NextResponse.json({ files: [] });
    }

    const files = fs
      .readdirSync(imagesDir)
      .filter((file) =>
        /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(file)
      )
      .sort();

    return NextResponse.json({ files });
  } catch (error) {
    console.error("Failed to list images:", error);
    return NextResponse.json(
      { files: [], error: "Failed to list images" },
      { status: 500 }
    );
  }
}