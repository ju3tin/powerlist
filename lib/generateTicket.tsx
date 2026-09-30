import { ImageResponse } from "@vercel/og";
import sharp from "sharp";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type TicketConfig = {
  eventLabel?: string;
  title?: string;
  year?: string;
  badgeText?: string;
  brandName?: string;
  brandInitials?: string;
  networkText?: string;
  issuedToLabel?: string;
  bgGradient?: string;
  accentFrom?: string;
  accentTo?: string;
  accentText?: string;
  mutedText?: string;
  badgeBorder?: string;
  avatarBorder?: string;
  titleSize?: number;
  nameSize?: number;
};

export type TicketParams = {
  name: string;
  tokenId?: string;
  imageUrl?: string;
  config?: TicketConfig;
};

// ─────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────

const defaultConfig: Required<TicketConfig> = {
  eventLabel: "Women in FinTech",
  title: "Powerlist",
  year: "2026",
  badgeText: "Digital Ticket",
  brandName: "innovate finance",
  brandInitials: "IF",
  networkText: "Avalanche Network",
  issuedToLabel: "Issued to",
  bgGradient: "linear-gradient(165deg, #0f1c2e 0%, #162d4a 45%, #0d1a2a 100%)",
  accentFrom: "#1e63f1",
  accentTo: "#5b9aff",
  accentText: "#5b9aff",
  mutedText: "#7a91a8",
  badgeBorder: "rgba(255,255,255,0.22)",
  avatarBorder: "rgba(91,154,255,0.6)",
  titleSize: 58,
  nameSize: 26,
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Fetches an image and returns a PNG data URL.
 * Required because @vercel/og does not support WebP.
 */
async function toPngDataUrl(imageUrl: string): Promise<string> {
  const res = await fetch(imageUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; TicketGenerator/1.0)",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch image: ${res.status} ${imageUrl}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const input = Buffer.from(arrayBuffer);

  const pngBuffer = await sharp(input)
    .png()
    .resize(176, 176, {
      fit: "cover",
      position: "centre",
    })
    .toBuffer();

  return `data:image/png;base64,${pngBuffer.toString("base64")}`;
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

export async function generateTicketImage({
  name,
  tokenId = "001",
  imageUrl,
  config: userConfig = {},
}: TicketParams): Promise<Buffer> {
  const c = { ...defaultConfig, ...userConfig };

  // Convert WebP / any format → PNG data URL for @vercel/og
  let safeImageUrl: string | undefined;
  if (imageUrl) {
    try {
      safeImageUrl = await toPngDataUrl(imageUrl);
    } catch (err) {
      console.warn("Could not convert image, falling back to initials:", err);
      safeImageUrl = undefined;
    }
  }

  const response = new ImageResponse(
    (
      <div
        style={{
          width: "600px",
          height: "840px",
          display: "flex",
          flexDirection: "column",
          background: c.bgGradient,
          color: "white",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            display: "flex",
            height: "8px",
            width: "100%",
            background: `linear-gradient(90deg, ${c.accentFrom}, ${c.accentTo})`,
          }}
        />

        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "28px 36px 0",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background: c.accentFrom,
                alignItems: "center",
                justifyContent: "center",
                fontSize: "15px",
                fontWeight: 700,
                marginRight: "12px",
              }}
            >
              {c.brandInitials}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: "18px",
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              {c.brandName}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              border: `1px solid ${c.badgeBorder}`,
              borderRadius: "999px",
              padding: "7px 14px",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#a8c0d8",
            }}
          >
            {c.badgeText}
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "52px 36px 0",
            flex: 1,
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#7eb0ff",
              marginBottom: "18px",
            }}
          >
            {c.eventLabel}
          </div>

          <div
            style={{
              display: "flex",
              fontSize: c.titleSize,
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: "-0.04em",
            }}
          >
            {c.title}
          </div>

          <div
            style={{
              display: "flex",
              fontSize: c.titleSize,
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: "-0.04em",
              color: c.accentText,
              marginBottom: "40px",
            }}
          >
            {c.year}
          </div>

          <div style={{ display: "flex", flex: 1 }} />

          {/* Profile + Issued to */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "36px",
            }}
          >
            {safeImageUrl ? (
              <img
                src={safeImageUrl}
                width={88}
                height={88}
                style={{
                  width: "88px",
                  height: "88px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: `3px solid ${c.avatarBorder}`,
                  marginRight: "20px",
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  width: "88px",
                  height: "88px",
                  borderRadius: "50%",
                  background: c.accentFrom,
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "28px",
                  fontWeight: 700,
                  marginRight: "20px",
                  border: `3px solid ${c.avatarBorder}`,
                }}
              >
                {name.charAt(0).toUpperCase()}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: c.mutedText,
                  marginBottom: "8px",
                }}
              >
                {c.issuedToLabel}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: c.nameSize,
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  maxWidth: "360px",
                }}
              >
                {name}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(255,255,255,0.12)",
            padding: "20px 36px",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: c.mutedText,
            width: "100%",
          }}
        >
          <div style={{ display: "flex" }}>{c.networkText}</div>
          <div style={{ display: "flex" }}>1 of 1 · #{tokenId}</div>
        </div>
      </div>
    ),
    {
      width: 600,
      height: 840,
    }
  );

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}