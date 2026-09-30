import sharp from "sharp";

/**
 * Fetches an image and returns a PNG data URL.
 * Needed because @vercel/og does not support WebP.
 */
export async function toPngDataUrl(imageUrl: string): Promise<string> {
  const res = await fetch(imageUrl, {
    headers: {
      // some CDNs block requests without a UA
      "User-Agent": "Mozilla/5.0 (compatible; TicketGenerator/1.0)",
    },
    next: { revalidate: 3600 }, // optional cache
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch image: ${res.status} ${imageUrl}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const input = Buffer.from(arrayBuffer);

  const pngBuffer = await sharp(input)
    .png()
    .resize(176, 176, {
      // 2x the 88px display size for sharpness
      fit: "cover",
      position: "centre",
    })
    .toBuffer();

  return `data:image/png;base64,${pngBuffer.toString("base64")}`;
}