import "server-only";

import { ImageResponse } from "@vercel/og";
import sharp from "sharp";
import {
  defaultTicketConfig,
  type TicketConfig,
  type TicketParams,
  type TicketLayer,
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

function str(v: unknown, fallback = ""): string {
  if (v == null) return fallback;
  return String(v);
}

function resolveText(
  template: unknown,
  vars: Record<string, string>
): string {
  const t = str(template, "");
  if (!t) return "";
  return t.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

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
): Promise<string | null> {
  try {
    if (!imageUrl) return null;
    const res = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TicketGenerator/1.0)",
      },
    });
    if (!res.ok) return null;
    const input = Buffer.from(await res.arrayBuffer());
    const png = await sharp(input)
      .png()
      .resize(Math.max(1, w), Math.max(1, h), {
        fit: "cover",
        position: "centre",
      })
      .toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch (err) {
    console.warn("toPngDataUrl failed:", imageUrl, err);
    return null;
  }
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
  const safeName = str(name, "Guest");
  const safeTokenId = str(tokenId, "001");
  const safeRole = str(role, "");
  const safeCategory = str(category, "");
  const safeYear = str(year, "2026");
  const safeLinkedin = str(linkedinUrl, "");
  const safeImageUrl = str(imageUrl, "");
  const safeCompanyLogo = str(companyLogo, "");

  const layers: TicketLayer[] = Array.isArray(userConfig?.layers)
    ? userConfig!.layers
    : defaultTicketConfig.layers;

  const c: TicketConfig = {
    ...defaultTicketConfig,
    ...userConfig,
    background: userConfig?.background ?? defaultTicketConfig.background,
    layers,
    showTopBar: userConfig?.showTopBar ?? defaultTicketConfig.showTopBar ?? true,
    width: userConfig?.width ?? defaultTicketConfig.width ?? 600,
    height: userConfig?.height ?? defaultTicketConfig.height ?? 840,
    fontFamily: userConfig?.fontFamily ?? defaultTicketConfig.fontFamily ?? "Inter",
  };

  const width = Number(c.width) || 600;
  const height = Number(c.height) || 840;
  const globalFont = str(c.fontFamily, "Inter");

  const vars: Record<string, string> = {
    name: safeName,
    tokenId: safeTokenId,
    role: safeRole,
    category: safeCategory,
    year: safeYear,
    linkedin: safeLinkedin,
  };

  const imageCache = new Map<string, string>();

  async function resolveImageSrc(
    src: unknown,
    w: number,
    h: number
  ): Promise<string | undefined> {
    const source = str(src, "");
    if (!source) return undefined;

    const key = `${source}|${w}x${h}`;
    if (imageCache.has(key)) return imageCache.get(key);

    let url = source;
    if (source === "avatar") {
      if (!safeImageUrl) return undefined;
      url = safeImageUrl;
    } else if (source === "company_logo") {
      if (!safeCompanyLogo) return undefined;
      url = safeCompanyLogo;
    }

    const dataUrl = await toPngDataUrl(
      url,
      Math.round(Math.max(1, w) * 2),
      Math.round(Math.max(1, h) * 2)
    );
    if (!dataUrl) return undefined;
    imageCache.set(key, dataUrl);
    return dataUrl;
  }

  // Background image
  let bgImage: string | undefined;
  if (c.background?.type === "image" && str(c.background.value)) {
    const data = await toPngDataUrl(str(c.background.value), width, height);
    if (data) bgImage = data;
  }

  // Fonts used by text layers
  const fontNames = new Set<string>();
  fontNames.add(globalFont);
  for (const layer of c.layers) {
    if (layer?.type === "text" && layer.visible !== false) {
      fontNames.add(str(layer.fontFamily, globalFont));
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
      if (!layer || layer.visible === false) return null;
      if (layer.type === "image") {
        const src = await resolveImageSrc(
          layer.src,
          Number(layer.width) || 88,
          Number(layer.height) || 88
        );
        return { layer, src };
      }
      return { layer, src: undefined as string | undefined };
    })
  );

  const bgStyle =
    c.background?.type === "gradient"
      ? { background: str(c.background.value, "#0f1c2e") }
      : c.background?.type === "color"
        ? { background: str(c.background.value, "#0f1c2e") }
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

        {resolvedLayers.map((item, index) => {
          if (!item) return null;
          const { layer, src } = item;

          if (layer.type === "text") {
            const text = resolveText(layer.content, vars);
            if (!text) return null;

            const layerFont = str(layer.fontFamily, globalFont);
            const fontFamilyCss =
              layerFont === "system" || !FONT_URLS[layerFont]
                ? "sans-serif"
                : `"${layerFont}", sans-serif`;

            return (
              <div
                key={str(layer.id, `text-${index}`)}
                style={{
                  display: "flex",
                  position: "absolute",
                  left: Number(layer.x) || 0,
                  top: Number(layer.y) || 0,
                  fontSize: Number(layer.fontSize) || 16,
                  color: str(layer.color, "#ffffff"),
                  fontFamily: fontFamilyCss,
                  fontWeight: Number(layer.fontWeight) || 700,
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
            const lw = Number(layer.width) || 88;
            const lh = Number(layer.height) || 88;
            const r = Number(layer.borderRadius) || 0;
            const borderRadius = r >= 999 ? lw / 2 : r;

            if (src) {
              return (
                <img
                  key={str(layer.id, `img-${index}`)}
                  src={src}
                  width={lw}
                  height={lh}
                  style={{
                    position: "absolute",
                    left: Number(layer.x) || 0,
                    top: Number(layer.y) || 0,
                    width: lw,
                    height: lh,
                    borderRadius,
                    objectFit: layer.objectFit ?? "cover",
                    border: layer.borderWidth
                      ? `${layer.borderWidth}px solid ${str(layer.borderColor, "transparent")}`
                      : undefined,
                    opacity: layer.opacity ?? 1,
                  }}
                />
              );
            }

            // Avatar fallback initials
            if (str(layer.src) === "avatar") {
              return (
                <div
                  key={str(layer.id, `avatar-${index}`)}
                  style={{
                    display: "flex",
                    position: "absolute",
                    left: Number(layer.x) || 0,
                    top: Number(layer.y) || 0,
                    width: lw,
                    height: lh,
                    borderRadius,
                    background: "#1e63f1",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: Math.round(lw * 0.32),
                    fontWeight: 700,
                    border: layer.borderWidth
                      ? `${layer.borderWidth}px solid ${str(layer.borderColor, "transparent")}`
                      : undefined,
                    opacity: layer.opacity ?? 1,
                  }}
                >
                  {safeName.charAt(0).toUpperCase() || "?"}
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