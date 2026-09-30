import "server-only";

import { ImageResponse } from "@vercel/og";
import sharp from "sharp";
import {
  defaultTicketConfig,
  type TicketConfig,
  type TicketParams,
} from "@/lib/ticketTypes";

export type { TicketConfig, TicketParams };
export { defaultTicketConfig };

const FONT_URLS: Record<string, string> = {
  Inter:
    "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.woff",
  "Space Grotesk":
    "https://cdn.jsdelivr.net/fontsource/fonts/space-grotesk@latest/latin-700-normal.woff",
  "IBM Plex Sans":
    "https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-sans@latest/latin-700-normal.woff",
  Geist:
    "https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-700-normal.woff",
  Roboto:
    "https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest/latin-700-normal.woff",
  "Open Sans":
    "https://cdn.jsdelivr.net/fontsource/fonts/open-sans@latest/latin-700-normal.woff",
  Montserrat:
    "https://cdn.jsdelivr.net/fontsource/fonts/montserrat@latest/latin-700-normal.woff",
  Poppins:
    "https://cdn.jsdelivr.net/fontsource/fonts/poppins@latest/latin-700-normal.woff",
  "Playfair Display":
    "https://cdn.jsdelivr.net/fontsource/fonts/playfair-display@latest/latin-700-normal.woff",
  Merriweather:
    "https://cdn.jsdelivr.net/fontsource/fonts/merriweather@latest/latin-700-normal.woff",
};

async function loadFontData(fontFamily: string): Promise<ArrayBuffer | null> {
  const url = FONT_URLS[fontFamily];
  if (!url) return null;
  try {
    const res = await fetch(url);
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

export async function generateTicketImage({
  name,
  tokenId = "001",
  imageUrl,
  role = "",
  category = "",
  year = "2026",
  companyLogo,
  linkedinUrl = "",
  config: userConfig,
}: TicketParams): Promise<Buffer> {
  const c: TicketConfig = {
    ...defaultTicketConfig,
    ...userConfig,
    background: userConfig?.background ?? defaultTicketConfig.background,
    layers: userConfig?.layers ?? defaultTicketConfig.layers,
    showTopBar: userConfig?.showTopBar ?? defaultTicketConfig.showTopBar ?? true,
  };

  const width = c.width ?? 600;
  const height = c.height ?? 840;
  const globalFont = c.fontFamily || "Inter";

  const vars: Record<string, string> = {
    name,
    tokenId,
    role,
    category,
    year,
    linkedin: linkedinUrl,
  };

  const imageCache = new Map<string, string>();

  async function resolveImageSrc(src: string, w: number, h: number) {
    const key = `${src}|${w}x${h}`;
    if (imageCache.has(key)) return imageCache.get(key)!;

    let url = src;
    if (src === "avatar") {
      if (!imageUrl) return undefined;
      url = imageUrl;
    } else if (src === "company_logo") {
      if (!companyLogo) return undefined;
      url = companyLogo;
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

  // Load all fonts used by text layers
  const fontNames = new Set<string>();
  fontNames.add(globalFont);
  for (const layer of c.layers) {
    if (layer.type === "text" && layer.visible !== false) {
      fontNames.add(layer.fontFamily || globalFont);
    }
  }

  const fonts: {
    name: string;
    data: ArrayBuffer;
    style: "normal";
    weight: 700;
  }[] = [];

  for (const fname of fontNames) {
    if (fname === "system") continue;
    const data = await loadFontData(fname);
    if (data) {
      fonts.push({ name: fname, data, style: "normal", weight: 700 });
    }
  }

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
          fontFamily: "sans-serif",
          ...bgStyle,
        }}
      >
        {c.showTopBar !== false && (
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
        )}

        {resolvedLayers.map((item) => {
          if (!item) return null;
          const { layer, src } = item;

          if (layer.type === "text") {
            const text = resolveText(layer.content, vars);
            if (!text.trim()) return null;
            const layerFont = layer.fontFamily || globalFont;
            const fontFamilyCss =
              layerFont === "system" || !FONT_URLS[layerFont]
                ? "sans-serif"
                : `"${layerFont}", sans-serif`;

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
                  fontFamily: fontFamilyCss,
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