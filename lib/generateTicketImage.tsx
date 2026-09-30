import { ImageResponse } from "@vercel/og";
import sharp from "sharp";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type TextLayer = {
  id: string;
  type: "text";
  content: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontWeight?: number;
  letterSpacing?: string;
  textTransform?: "none" | "uppercase";
  maxWidth?: number;
  opacity?: number;
  visible?: boolean;
};

export type ImageLayer = {
  id: string;
  type: "image";
  src: string; // "avatar" | url
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
  opacity?: number;
  visible?: boolean;
  objectFit?: "cover" | "contain";
};

export type TicketLayer = TextLayer | ImageLayer;

export type BackgroundConfig =
  | { type: "gradient"; value: string }
  | { type: "color"; value: string }
  | { type: "image"; value: string };

export type TicketConfig = {
  background: BackgroundConfig;
  fontFamily?: string;
  width?: number;
  height?: number;
  layers: TicketLayer[];
};

export type TicketParams = {
  name: string;
  tokenId?: string;
  imageUrl?: string;
  role?: string;
  category?: string;
  year?: string;
  config?: TicketConfig;
};

// ─────────────────────────────────────────────
// Default (vertical)
// ─────────────────────────────────────────────

export const defaultTicketConfig: TicketConfig = {
  width: 600,
  height: 840,
  fontFamily: "Inter",
  background: {
    type: "gradient",
    value: "linear-gradient(165deg, #0f1c2e 0%, #162d4a 45%, #0d1a2a 100%)",
  },
  layers: [
    {
      id: "brand-initials",
      type: "text",
      content: "IF",
      x: 36,
      y: 40,
      fontSize: 15,
      color: "#ffffff",
      fontWeight: 700,
      visible: true,
    },
    {
      id: "brand-name",
      type: "text",
      content: "innovate finance",
      x: 90,
      y: 42,
      fontSize: 18,
      color: "#ffffff",
      fontWeight: 700,
      visible: true,
    },
    {
      id: "badge",
      type: "text",
      content: "Digital Ticket",
      x: 420,
      y: 44,
      fontSize: 11,
      color: "#a8c0d8",
      fontWeight: 700,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      visible: true,
    },
    {
      id: "event-label",
      type: "text",
      content: "Women in FinTech",
      x: 36,
      y: 140,
      fontSize: 13,
      color: "#7eb0ff",
      fontWeight: 700,
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      visible: true,
    },
    {
      id: "title",
      type: "text",
      content: "Powerlist",
      x: 36,
      y: 175,
      fontSize: 58,
      color: "#ffffff",
      fontWeight: 700,
      visible: true,
    },
    {
      id: "year",
      type: "text",
      content: "{{year}}",
      x: 36,
      y: 240,
      fontSize: 58,
      color: "#5b9aff",
      fontWeight: 700,
      visible: true,
    },
    {
      id: "avatar",
      type: "image",
      src: "avatar",
      x: 36,
      y: 620,
      width: 88,
      height: 88,
      borderRadius: 999,
      borderColor: "rgba(91,154,255,0.6)",
      borderWidth: 3,
      visible: true,
      objectFit: "cover",
    },
    {
      id: "issued-label",
      type: "text",
      content: "Issued to",
      x: 144,
      y: 630,
      fontSize: 11,
      color: "#7a91a8",
      fontWeight: 700,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      visible: true,
    },
    {
      id: "name",
      type: "text",
      content: "{{name}}",
      x: 144,
      y: 652,
      fontSize: 26,
      color: "#ffffff",
      fontWeight: 600,
      maxWidth: 360,
      visible: true,
    },
    {
      id: "role",
      type: "text",
      content: "{{role}}",
      x: 144,
      y: 688,
      fontSize: 16,
      color: "#a8c0d8",
      fontWeight: 500,
      maxWidth: 360,
      visible: true,
    },
    {
      id: "network",
      type: "text",
      content: "Avalanche Network",
      x: 36,
      y: 800,
      fontSize: 11,
      color: "#7a91a8",
      fontWeight: 700,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      visible: true,
    },
    {
      id: "token",
      type: "text",
      content: "1 of 1 · #{{tokenId}}",
      x: 400,
      y: 800,
      fontSize: 11,
      color: "#7a91a8",
      fontWeight: 700,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      visible: true,
    },
  ],
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const FONT_URLS: Record<string, string> = {
  Inter:
    "https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Bold.woff",
  "Space Grotesk":
    "https://cdn.jsdelivr.net/fontsource/fonts/space-grotesk@latest/latin-700-normal.woff",
  "IBM Plex Sans":
    "https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-sans@latest/latin-700-normal.woff",
  Geist:
    "https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-700-normal.woff",
};

async function loadFont(fontFamily: string): Promise<ArrayBuffer | null> {
  if (!fontFamily || fontFamily === "system" || !FONT_URLS[fontFamily])
    return null;
  try {
    const res = await fetch(FONT_URLS[fontFamily]);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

async function toPngDataUrl(
  imageUrl: string,
  w = 200,
  h = 200
): Promise<string> {
  const res = await fetch(imageUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; TicketGenerator/1.0)",
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const input = Buffer.from(await res.arrayBuffer());
  const png = await sharp(input)
    .png()
    .resize(w, h, { fit: "cover", position: "centre" })
    .toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

function resolveText(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

export async function generateTicketImage({
  name,
  tokenId = "001",
  imageUrl,
  role = "",
  category = "",
  year = "2026",
  config: userConfig,
}: TicketParams): Promise<Buffer> {
  const c: TicketConfig = {
    ...defaultTicketConfig,
    ...userConfig,
    background: userConfig?.background ?? defaultTicketConfig.background,
    layers: userConfig?.layers ?? defaultTicketConfig.layers,
  };

  const width = c.width ?? 600;
  const height = c.height ?? 840;

  const vars = { name, tokenId, role, category, year };

  const imageCache = new Map<string, string>();

  async function resolveImageSrc(src: string, w: number, h: number) {
    const key = `${src}|${w}x${h}`;
    if (imageCache.has(key)) return imageCache.get(key)!;

    let url = src;
    if (src === "avatar") {
      if (!imageUrl) return undefined;
      url = imageUrl;
    }

    try {
      const dataUrl = await toPngDataUrl(
        url,
        Math.round(w * 2),
        Math.round(h * 2)
      );
      imageCache.set(key, dataUrl);
      return dataUrl;
    } catch (err) {
      console.warn("Image failed:", src, err);
      return undefined;
    }
  }

  let bgImage: string | undefined;
  if (c.background.type === "image" && c.background.value) {
    try {
      bgImage = await toPngDataUrl(c.background.value, width, height);
    } catch (err) {
      console.warn("Background image failed:", err);
    }
  }

  const fontData = await loadFont(c.fontFamily || "Inter");
  const fonts = fontData
    ? [
        {
          name: c.fontFamily || "Inter",
          data: fontData,
          style: "normal" as const,
          weight: 700 as const,
        },
      ]
    : [];

  const fontFamilyCss =
    !fontData || c.fontFamily === "system"
      ? "sans-serif"
      : `"${c.fontFamily}", sans-serif`;

  const resolvedLayers = await Promise.all(
    c.layers.map(async (layer) => {
      if (layer.visible === false) return null;
      if (layer.type === "image") {
        const src = await resolveImageSrc(layer.src, layer.width, layer.height);
        return { layer, src };
      }
      return { layer, src: undefined as string | undefined };
    })
  );

  const bgStyle =
    c.background.type === "gradient"
      ? { background: c.background.value }
      : c.background.type === "color"
        ? { background: c.background.value }
        : bgImage
          ? {
              backgroundImage: `url(${bgImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : { background: "#0f1c2e" };

  const response = new ImageResponse(
    (
      <div
        style={{
          width: `${width}px`,
          height: `${height}px`,
          display: "flex",
          position: "relative",
          overflow: "hidden",
          color: "white",
          fontFamily: fontFamilyCss,
          ...bgStyle,
        }}
      >
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "8px",
            background: "linear-gradient(90deg, #1e63f1, #5b9aff)",
          }}
        />

        {resolvedLayers.map((item) => {
          if (!item) return null;
          const { layer, src } = item;

          if (layer.type === "text") {
            const text = resolveText(layer.content, vars);
            if (!text.trim()) return null;
            return (
              <div
                key={layer.id}
                style={{
                  display: "flex",
                  position: "absolute",
                  left: layer.x,
                  top: layer.y,
                  fontSize: layer.fontSize,
                  color: layer.color,
                  fontWeight: layer.fontWeight ?? 700,
                  letterSpacing: layer.letterSpacing,
                  textTransform: layer.textTransform ?? "none",
                  maxWidth: layer.maxWidth,
                  opacity: layer.opacity ?? 1,
                  lineHeight: 1.15,
                }}
              >
                {text}
              </div>
            );
          }

          if (layer.type === "image") {
            const r = layer.borderRadius ?? 0;
            if (src) {
              return (
                <img
                  key={layer.id}
                  src={src}
                  width={layer.width}
                  height={layer.height}
                  style={{
                    position: "absolute",
                    left: layer.x,
                    top: layer.y,
                    width: layer.width,
                    height: layer.height,
                    borderRadius: r >= 999 ? layer.width / 2 : r,
                    objectFit: layer.objectFit ?? "cover",
                    border: layer.borderWidth
                      ? `${layer.borderWidth}px solid ${layer.borderColor || "transparent"}`
                      : undefined,
                    opacity: layer.opacity ?? 1,
                  }}
                />
              );
            }
            if (layer.src === "avatar") {
              return (
                <div
                  key={layer.id}
                  style={{
                    display: "flex",
                    position: "absolute",
                    left: layer.x,
                    top: layer.y,
                    width: layer.width,
                    height: layer.height,
                    borderRadius: r >= 999 ? layer.width / 2 : r,
                    background: "#1e63f1",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: Math.round(layer.width * 0.32),
                    fontWeight: 700,
                    border: layer.borderWidth
                      ? `${layer.borderWidth}px solid ${layer.borderColor || "transparent"}`
                      : undefined,
                    opacity: layer.opacity ?? 1,
                  }}
                >
                  {name.charAt(0).toUpperCase()}
                </div>
              );
            }
          }

          return null;
        })}
      </div>
    ),
    { width, height, fonts }
  );

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}