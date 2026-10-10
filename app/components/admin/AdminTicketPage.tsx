"use client";

import { useState, useCallback, useEffect, useRef } from "react";

import AdminNav from "@/components/nav";

import {
  defaultTicketConfig,
  TICKET_FONTS,
  type TicketConfig,
  type TicketLayer,
  type TextLayer,
  type ImageLayer,
  type BackgroundConfig,
} from "@/lib/ticketTypes";

type OtherItem = {
  other_type: string;
  other_type_value: string;
};

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

const HORIZONTAL_PRESET: TicketConfig = {
  ...defaultTicketConfig,
  width: 1200,
  height: 630,
  layers: defaultTicketConfig.layers.map((l) => ({
    ...l,
    x: Math.min(l.x, 1100),
    y: Math.round(l.y * 0.7),
  })),
};

export default function AdminTicketPage() {
  // -----------------------------
  // Sample profile data
  // -----------------------------

  const [name, setName] = useState("Allen Rohner");

  const [tokenId, setTokenId] = useState("387640");

  const [imageUrl, setImageUrl] = useState(
    "/images/Allen-Rohner-low-res.jpg"
  );

  const [role, setRole] = useState("CTO and Co-founder");

  const [category, setCategory] = useState("Senior");

  const [year, setYear] = useState("2026");

  const [companyLogo, setCompanyLogo] = useState(
    "/images/Griffin-Logo-Linkedin-300.png"
  );

  // Images available in public/images
  const [imageFiles, setImageFiles] = useState<string[]>([]);

  const [linkedinUrl, setLinkedinUrl] = useState(
    "https://www.linkedin.com/in/allenrohner/"
  );

  // NEW: Other profile information
  const [other, setOther] = useState<OtherItem[]>([
    {
      other_type: "award",
      other_type_value: "FinTech Leader 2026",
    },
  ]);

  // -----------------------------
  // Ticket configuration
  // -----------------------------

  const [config, setConfig] =
    useState<TicketConfig>(defaultTicketConfig);

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [saved, setSaved] = useState(false);

  const [loaded, setLoaded] = useState(false);

  const [zoom, setZoom] = useState(0.7);

  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const canvasW = config.width ?? 600;
  const canvasH = config.height ?? 840;

  // -----------------------------
  // Load Google Fonts
  // -----------------------------

  useEffect(() => {
    const families = [
      "Inter",
      "Space+Grotesk",
      "IBM+Plex+Sans",
      "Roboto",
      "Open+Sans",
      "Montserrat",
      "Poppins",
      "Playfair+Display",
      "Merriweather",
    ];

    const links: HTMLLinkElement[] = [];

    for (const f of families) {
      const link = document.createElement("link");

      link.rel = "stylesheet";

      link.href = `https://fonts.googleapis.com/css2?family=${f}:wght@400;600;700&display=swap`;

      document.head.appendChild(link);

      links.push(link);
    }

    return () => links.forEach((l) => l.remove());
  }, []);

  // -----------------------------
  // Load image files from /images
  // -----------------------------

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/images");
        const data = await res.json();
        if (data.files && Array.isArray(data.files)) {
          setImageFiles(data.files);
        }
      } catch {
        // Keep empty list
      }
    })();
  }, []);

  // -----------------------------
  // Load saved ticket config
  // -----------------------------

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/ticket-config");

        const data = await res.json();

        if (data.success && data.config?.layers) {
          setConfig({
            ...defaultTicketConfig,
            ...data.config,
          });
        }
      } catch {
        // Keep defaults
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // -----------------------------
  // Selected layer
  // -----------------------------

  const selected =
    config.layers.find((l) => l.id === selectedId) ?? null;

  // -----------------------------
  // Layer helpers
  // -----------------------------

  const updateLayer = useCallback(
    (id: string, patch: Partial<TicketLayer>) => {
      setConfig((prev) => ({
        ...prev,
        layers: prev.layers.map((l) =>
          l.id === id
            ? ({ ...l, ...patch } as TicketLayer)
            : l
        ),
      }));

      setSaved(false);
    },
    []
  );

  const setBackground = (bg: BackgroundConfig) => {
    setConfig((prev) => ({
      ...prev,
      background: bg,
    }));

    setSaved(false);
  };

  // -----------------------------
  // Other helpers
  // -----------------------------

  function addOther() {
    setOther((previous) => [
      ...previous,
      {
        other_type: "",
        other_type_value: "",
      },
    ]);
  }

  function updateOther(
    index: number,
    field: keyof OtherItem,
    value: string
  ) {
    setOther((previous) =>
      previous.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );

    setSaved(false);
  }

  function removeOther(index: number) {
    setOther((previous) =>
      previous.filter((_, i) => i !== index)
    );

    setSaved(false);
  }

  // Convert Other array into text for {{other}}
  function getOtherText() {
    return other
      .filter(
        (item) =>
          item.other_type.trim() ||
          item.other_type_value.trim()
      )
      .map((item) => {
        if (
          item.other_type &&
          item.other_type_value
        ) {
          return `${item.other_type}: ${item.other_type_value}`;
        }

        return (
          item.other_type ||
          item.other_type_value
        );
      })
      .join(" · ");
  }

  // -----------------------------
  // Pointer dragging
  // -----------------------------

  function onPointerDown(
    e: React.PointerEvent,
    id: string
  ) {
    e.preventDefault();
    e.stopPropagation();

    const layer = config.layers.find(
      (l) => l.id === id
    );

    if (!layer) return;

    setSelectedId(id);

    dragRef.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      origX: layer.x,
      origY: layer.y,
    };

    (e.target as HTMLElement).setPointerCapture(
      e.pointerId
    );
  }

  function onPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;

    if (!drag) return;

    const dx =
      (e.clientX - drag.startX) / zoom;

    const dy =
      (e.clientY - drag.startY) / zoom;

    updateLayer(drag.id, {
      x: Math.round(drag.origX + dx),
      y: Math.round(drag.origY + dy),
    });
  }

  function onPointerUp(e: React.PointerEvent) {
    if (dragRef.current) {
      dragRef.current = null;

      try {
        (
          e.target as HTMLElement
        ).releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
    }
  }

  // -----------------------------
  // Add layers
  // -----------------------------

  function addTextLayer() {
    const layer: TextLayer = {
      id: uid(),
      type: "text",
      content: "New text",
      x: Math.round(canvasW / 2 - 40),
      y: Math.round(canvasH / 2),
      fontSize: 20,
      color: "#ffffff",
      fontFamily:
        config.fontFamily || "Inter",
      fontWeight: 700,
      visible: true,
    };

    setConfig((prev) => ({
      ...prev,
      layers: [...prev.layers, layer],
    }));

    setSelectedId(layer.id);

    setSaved(false);
  }

  function addImageLayer() {
    const layer: ImageLayer = {
      id: uid(),
      type: "image",
      src: "avatar",
      x: Math.round(canvasW / 2 - 44),
      y: Math.round(canvasH / 2 - 44),
      width: 88,
      height: 88,
      borderRadius: 999,
      borderWidth: 3,
      borderColor:
        "rgba(91,154,255,0.6)",
      visible: true,
      objectFit: "cover",
    };

    setConfig((prev) => ({
      ...prev,
      layers: [...prev.layers, layer],
    }));

    setSelectedId(layer.id);

    setSaved(false);
  }

  function removeLayer(id: string) {
    setConfig((prev) => ({
      ...prev,
      layers: prev.layers.filter(
        (l) => l.id !== id
      ),
    }));

    if (selectedId === id) {
      setSelectedId(null);
    }

    setSaved(false);
  }

  function scaleLayer(
    id: string,
    factor: number
  ) {
    const layer = config.layers.find(
      (l) => l.id === id
    );

    if (!layer) return;

    if (layer.type === "text") {
      updateLayer(id, {
        fontSize: Math.max(
          8,
          Math.round(
            layer.fontSize * factor
          )
        ),
      });
    } else {
      updateLayer(id, {
        width: Math.max(
          16,
          Math.round(layer.width * factor)
        ),
        height: Math.max(
          16,
          Math.round(layer.height * factor)
        ),
      });
    }
  }

  function applyFontToAllText() {
    const font =
      config.fontFamily || "Inter";

    setConfig((prev) => ({
      ...prev,
      layers: prev.layers.map((l) =>
        l.type === "text"
          ? {
              ...l,
              fontFamily: font,
            }
          : l
      ),
    }));

    setSaved(false);
  }

  // -----------------------------
  // Preview
  // -----------------------------

  async function handlePreview() {
    setLoading(true);
    setError("");
    setPreviewUrl(null);

    try {
      const res = await fetch(
        "/api/preview-ticket2",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            tokenId,
            imageUrl:
              imageUrl || undefined,
            role,
            category,
            year,
            companyLogo:
              companyLogo || undefined,
            linkedinUrl:
              linkedinUrl || undefined,

            // NEW
            other,

            config,
          }),
        }
      );

      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({}));

        throw new Error(
          data.error || "Preview failed"
        );
      }

      const blob = await res.blob();

      setPreviewUrl(
        URL.createObjectURL(blob)
      );
    } catch (err: any) {
      setError(
        err.message || "Preview failed"
      );
    } finally {
      setLoading(false);
    }
  }

  // -----------------------------
  // Save
  // -----------------------------

  async function handleSave() {
    setSaving(true);
    setError("");

    try {
      const res = await fetch(
        "/api/ticket-config",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            config,
          }),
        }
      );

      const data = await res.json();

      if (!data.success) {
        throw new Error(
          data.error || "Save failed"
        );
      }

      setSaved(true);
    } catch (err: any) {
      setError(
        err.message || "Save failed"
      );
    } finally {
      setSaving(false);
    }
  }

  // -----------------------------
  // Template variables
  // -----------------------------

  function displayText(content: string) {
    return content
      .replace(
        /\{\{name\}\}/g,
        name
      )
      .replace(
        /\{\{role\}\}/g,
        role
      )
      .replace(
        /\{\{tokenId\}\}/g,
        tokenId
      )
      .replace(
        /\{\{year\}\}/g,
        year
      )
      .replace(
        /\{\{category\}\}/g,
        category
      )
      .replace(
        /\{\{linkedin\}\}/g,
        linkedinUrl
      )
      .replace(
        /\{\{other\}\}/g,
        getOtherText()
      );
  }

  // -----------------------------
  // Background
  // -----------------------------

  const bgStyle: React.CSSProperties =
    config.background.type ===
    "gradient"
      ? {
          background:
            config.background.value,
        }
      : config.background.type ===
        "color"
      ? {
          background:
            config.background.value,
        }
      : config.background.type ===
          "image" &&
        config.background.value
      ? {
          backgroundImage: `url(${config.background.value})`,
          backgroundSize: "cover",
          backgroundPosition:
            "center",
        }
      : {
          background: "#0f1c2e",
        };

  if (!loaded) {
    return (
      <div className="min-h-screen bg-[#0a1220] text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1220] text-white">
      <AdminNav />

      {/* Header */}

      <header className="border-b border-white/10 px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">
            Ticket Designer
          </h1>

          <p className="text-xs text-gray-400">
            Drag layers · Fonts · MongoDB
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Zoom */}

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <button
              type="button"
              onClick={() =>
                setZoom((z) =>
                  Math.max(0.3, z - 0.1)
                )
              }
              className="px-2 py-1 rounded bg-white/10 hover:bg-white/15"
            >
              −
            </button>

            <span className="w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>

            <button
              type="button"
              onClick={() =>
                setZoom((z) =>
                  Math.min(1.5, z + 0.1)
                )
              }
              className="px-2 py-1 rounded bg-white/10 hover:bg-white/15"
            >
              +
            </button>
          </div>

          {/* Reset */}

          <button
            type="button"
            onClick={() => {
              setConfig(
                defaultTicketConfig
              );

              setSaved(false);
            }}
            className="text-sm px-3 py-1.5 rounded-lg border border-white/15 hover:bg-white/5"
          >
            Reset
          </button>

          {/* Preview */}

          <button
            type="button"
            onClick={handlePreview}
            disabled={loading}
            className="text-sm px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 disabled:opacity-50"
          >
            {loading ? "…" : "PNG Preview"}
          </button>

          {/* Save */}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="text-sm px-3 py-1.5 rounded-lg bg-[#1e63f1] hover:bg-[#1854d1] disabled:opacity-50"
          >
            {saving
              ? "Saving…"
              : saved
              ? "Saved ✓"
              : "Save"}
          </button>
        </div>
      </header>

      <div className="grid lg:grid-cols-[280px_1fr_280px] min-h-[calc(100vh-57px)]">
        {/* =====================================================
            LEFT
        ===================================================== */}

        <div className="border-r border-white/10 p-4 overflow-y-auto max-h-[calc(100vh-57px)] space-y-5">
          {/* Sample data */}

          <Section title="Sample data">
            <Field
              label="Name"
              value={name}
              onChange={setName}
            />

            <Field
              label="Token ID"
              value={tokenId}
              onChange={setTokenId}
            />

            <ImagePicker
              label="Avatar"
              value={imageUrl}
              onChange={setImageUrl}
              imageFiles={imageFiles}
            />

            <Field
              label="Role"
              value={role}
              onChange={setRole}
            />

            <Field
              label="Category"
              value={category}
              onChange={setCategory}
            />

            <Field
              label="Year"
              value={year}
              onChange={setYear}
            />

            <ImagePicker
              label="Company logo"
              value={companyLogo}
              onChange={setCompanyLogo}
              imageFiles={imageFiles}
            />

            <Field
              label="LinkedIn URL"
              value={linkedinUrl}
              onChange={setLinkedinUrl}
            />
          </Section>

          {/* Other */}

          <Section title="Other profile data">
            <div className="space-y-3">
              {other.map(
                (item, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2"
                  >
                    <Field
                      label="Type"
                      value={
                        item.other_type
                      }
                      onChange={(value) =>
                        updateOther(
                          index,
                          "other_type",
                          value
                        )
                      }
                    />

                    <Field
                      label="Value"
                      value={
                        item.other_type_value
                      }
                      onChange={(value) =>
                        updateOther(
                          index,
                          "other_type_value",
                          value
                        )
                      }
                    />

                    <button
                      type="button"
                      onClick={() =>
                        removeOther(
                          index
                        )
                      }
                      className="w-full text-xs py-2 rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500/20"
                    >
                      Remove
                    </button>
                  </div>
                )
              )}

              <button
                type="button"
                onClick={addOther}
                className="w-full text-xs py-2 rounded-lg bg-white/10 hover:bg-white/15"
              >
                + Add Other
              </button>

              {other.length > 0 && (
                <div className="text-[10px] text-gray-500">
                  Template variable:
                  <br />
                  <code>
                    {"{{other}}"}
                  </code>
                </div>
              )}
            </div>
          </Section>

          {/* Ticket size */}

          <Section title="Ticket size">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfig(
                    defaultTicketConfig
                  );
                  setSaved(false);
                }}
                className={`flex-1 text-xs py-2 rounded-lg border ${
                  canvasW <= canvasH
                    ? "bg-[#1e63f1]/30 border-[#5b9aff]/50"
                    : "bg-white/5 border-white/10"
                }`}
              >
                Vertical

                <span className="block text-[10px] text-gray-400">
                  600×840
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setConfig(
                    HORIZONTAL_PRESET
                  );
                  setSaved(false);
                }}
                className={`flex-1 text-xs py-2 rounded-lg border ${
                  canvasW > canvasH
                    ? "bg-[#1e63f1]/30 border-[#5b9aff]/50"
                    : "bg-white/5 border-white/10"
                }`}
              >
                Horizontal

                <span className="block text-[10px] text-gray-400">
                  1200×630
                </span>
              </button>
            </div>

            <Field
              label="Width"
              type="number"
              value={String(canvasW)}
              onChange={(v) => {
                setConfig((p) => ({
                  ...p,
                  width:
                    Number(v) || 600,
                }));

                setSaved(false);
              }}
            />

            <Field
              label="Height"
              type="number"
              value={String(canvasH)}
              onChange={(v) => {
                setConfig((p) => ({
                  ...p,
                  height:
                    Number(v) || 840,
                }));

                setSaved(false);
              }}
            />
          </Section>

          {/* Default font */}

          <Section title="Default font">
            <select
              value={
                config.fontFamily ||
                "Inter"
              }
              onChange={(e) => {
                setConfig((p) => ({
                  ...p,
                  fontFamily:
                    e.target.value,
                }));

                setSaved(false);
              }}
              className="input"
            >
              {TICKET_FONTS.map((f) => (
                <option
                  key={f}
                  value={f}
                >
                  {f}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={
                applyFontToAllText
              }
              className="w-full text-xs py-2 rounded-lg bg-white/10 hover:bg-white/15 mt-1"
            >
              Apply default font to all
              text
            </button>
          </Section>

          {/* Background */}

          <Section title="Background">
            <select
              value={
                config.background.type
              }
              onChange={(e) => {
                const type =
                  e.target
                    .value as BackgroundConfig["type"];

                if (type === "gradient") {
                  setBackground({
                    type: "gradient",
                    value:
                      "linear-gradient(165deg, #0f1c2e 0%, #162d4a 45%, #0d1a2a 100%)",
                  });
                } else if (
                  type === "color"
                ) {
                  setBackground({
                    type: "color",
                    value: "#0f1c2e",
                  });
                } else {
                  setBackground({
                    type: "image",
                    value: "",
                  });
                }
              }}
              className="input"
            >
              <option value="gradient">
                Gradient
              </option>

              <option value="color">
                Solid color
              </option>

              <option value="image">
                Image
              </option>
            </select>

            {config.background.type ===
              "gradient" && (
              <Field
                label="Gradient CSS"
                value={
                  config.background.value
                }
                onChange={(v) =>
                  setBackground({
                    type: "gradient",
                    value: v,
                  })
                }
              />
            )}

            {config.background.type ===
              "color" && (
              <ColorField
                label="Color"
                value={
                  config.background.value
                }
                onChange={(v) =>
                  setBackground({
                    type: "color",
                    value: v,
                  })
                }
              />
            )}

            {config.background.type ===
              "image" && (
              <Field
                label="Image URL"
                value={
                  config.background.value
                }
                onChange={(v) =>
                  setBackground({
                    type: "image",
                    value: v,
                  })
                }
              />
            )}

            <Toggle
              label="Show top accent bar"
              checked={
                config.showTopBar !== false
              }
              onChange={(v) => {
                setConfig((p) => ({
                  ...p,
                  showTopBar: v,
                }));

                setSaved(false);
              }}
            />
          </Section>

          {/* Add layer */}

          <Section title="Add layer">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={addTextLayer}
                className="flex-1 text-xs py-2 rounded-lg bg-white/10 hover:bg-white/15"
              >
                + Text
              </button>

              <button
                type="button"
                onClick={addImageLayer}
                className="flex-1 text-xs py-2 rounded-lg bg-white/10 hover:bg-white/15"
              >
                + Image
              </button>
            </div>
          </Section>

          {/* Layers */}

          <Section title="Layers">
            <div className="space-y-1">
              {config.layers.map(
                (layer) => (
                  <button
                    key={layer.id}
                    type="button"
                    onClick={() =>
                      setSelectedId(
                        layer.id
                      )
                    }
                    className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg flex justify-between ${
                      selectedId === layer.id
                        ? "bg-[#1e63f1]/30 border border-[#5b9aff]/50"
                        : "bg-white/5 border border-transparent hover:bg-white/10"
                    }`}
                  >
                    <span className="truncate">
                      {layer.type ===
                      "text"
                        ? `T · ${layer.content.slice(
                            0,
                            18
                          )}`
                        : `I · ${
                            layer.src ===
                            "avatar"
                              ? "avatar"
                              : layer.src ===
                                "company_logo"
                              ? "logo"
                              : "img"
                          }`}
                    </span>

                    {layer.visible ===
                      false && (
                      <span className="text-gray-500">
                        hidden
                      </span>
                    )}
                  </button>
                )
              )}
            </div>
          </Section>

          {error && (
            <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>

        {/* =====================================================
            CENTER
        ===================================================== */}

        <div
          className="flex items-start justify-center p-6 overflow-auto bg-[#080e18]"
          onClick={() =>
            setSelectedId(null)
          }
        >
          <div
            style={{
              width: canvasW * zoom,
              height: canvasH * zoom,
              position: "relative",
            }}
          >
            <div
              style={{
                width: canvasW,
                height: canvasH,
                transform: `scale(${zoom})`,
                transformOrigin:
                  "top left",
                position: "relative",
                overflow: "hidden",
                boxShadow:
                  "0 25px 50px rgba(0,0,0,0.5)",
                ...bgStyle,
              }}
              onPointerMove={
                onPointerMove
              }
              onPointerUp={onPointerUp}
              onPointerLeave={
                onPointerUp
              }
            >
              {/* Top bar */}

              {config.showTopBar !==
                false && (
                <div
                  style={{
                    position:
                      "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: 8,
                    background:
                      "linear-gradient(90deg, #1e63f1, #5b9aff)",
                    pointerEvents:
                      "none",
                  }}
                />
              )}

              {/* Layers */}

              {config.layers.map(
                (layer) => {
                  if (
                    layer.visible ===
                    false
                  ) {
                    return null;
                  }

                  const isSelected =
                    layer.id ===
                    selectedId;

                  // Text layer

                  if (
                    layer.type ===
                    "text"
                  ) {
                    return (
                      <div
                        key={layer.id}
                        onPointerDown={(
                          e
                        ) =>
                          onPointerDown(
                            e,
                            layer.id
                          )
                        }
                        onClick={(e) =>
                          e.stopPropagation()
                        }
                        style={{
                          position:
                            "absolute",
                          left: layer.x,
                          top: layer.y,
                          fontSize:
                            layer.fontSize,
                          color:
                            layer.color,
                          fontFamily:
                            layer.fontFamily ||
                            config.fontFamily ||
                            "Inter",
                          fontWeight:
                            layer.fontWeight ??
                            700,
                          letterSpacing:
                            layer.letterSpacing,
                          textTransform:
                            layer.textTransform ??
                            "none",
                          maxWidth:
                            layer.maxWidth,
                          opacity:
                            layer.opacity ??
                            1,
                          lineHeight: 1.15,
                          cursor:
                            "grab",
                          userSelect:
                            "none",
                          outline:
                            isSelected
                              ? "2px solid #5b9aff"
                              : "1px solid transparent",
                          outlineOffset: 4,
                          padding: 2,
                          transform: `rotate(${(layer as any).rotation ?? 0}deg)`,
                          transformOrigin: "center center",
                        }}
                      >
                        {displayText(
                          layer.content
                        ) || " "}
                      </div>
                    );
                  }

                  // Image layer

                  const r =
                    layer.borderRadius ??
                    0;

                  const borderRadius =
                    r >= 999
                      ? layer.width / 2
                      : r;

                  const src =
                    layer.src ===
                    "avatar"
                      ? imageUrl ||
                        undefined
                      : layer.src ===
                        "company_logo"
                      ? companyLogo ||
                        undefined
                      : layer.src;

                  return (
                    <div
                      key={layer.id}
                      onPointerDown={(
                        e
                      ) =>
                        onPointerDown(
                          e,
                          layer.id
                        )
                      }
                      onClick={(e) =>
                        e.stopPropagation()
                      }
                      style={{
                        position:
                          "absolute",
                        left: layer.x,
                        top: layer.y,
                        width:
                          layer.width,
                        height:
                          layer.height,
                        borderRadius,
                        overflow:
                          "hidden",
                        cursor:
                          "grab",
                        outline:
                          isSelected
                            ? "2px solid #5b9aff"
                            : "1px solid transparent",
                        outlineOffset: 3,
                        transform: `rotate(${(layer as any).rotation ?? 0}deg)`,
                        transformOrigin: "center center",
                        border:
                          layer.borderWidth && layer.borderWidth > 0
                            ? `${layer.borderWidth}px solid ${
                                layer.borderColor ||
                                "transparent"
                              }`
                            : "none",
                        background:
                          src
                            ? undefined
                            : "#1e63f1",
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        fontWeight: 700,
                        fontSize:
                          Math.round(
                            layer.width *
                              0.32
                          ),
                        color:
                          "white",
                      }}
                    >
                      {src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={src}
                          alt=""
                          draggable={
                            false
                          }
                          style={{
                            width:
                              "100%",
                            height:
                              "100%",
                            objectFit:
                              layer.objectFit ??
                              "cover",
                            pointerEvents:
                              "none",
                          }}
                        />
                      ) : (
                        name
                          .charAt(0)
                          .toUpperCase()
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>

        {/* =====================================================
            RIGHT
        ===================================================== */}

        <div className="border-l border-white/10 p-4 overflow-y-auto max-h-[calc(100vh-57px)] space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#7eb0ff]">
            Selected layer
          </h2>

          {!selected && (
            <p className="text-sm text-gray-500">
              Click or drag a layer on the
              canvas
            </p>
          )}

          {selected && (
            <>
              {/* Layer controls */}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    scaleLayer(
                      selected.id,
                      1.1
                    )
                  }
                  className="flex-1 text-xs py-2 rounded-lg bg-white/10 hover:bg-white/15"
                >
                  Scale +
                </button>

                <button
                  type="button"
                  onClick={() =>
                    scaleLayer(
                      selected.id,
                      0.9
                    )
                  }
                  className="flex-1 text-xs py-2 rounded-lg bg-white/10 hover:bg-white/15"
                >
                  Scale −
                </button>

                <button
                  type="button"
                  onClick={() =>
                    removeLayer(
                      selected.id
                    )
                  }
                  className="flex-1 text-xs py-2 rounded-lg bg-red-500/20 text-red-300"
                >
                  Remove
                </button>
              </div>

              <Toggle
                label="Visible"
                checked={
                  selected.visible !==
                  false
                }
                onChange={(v) =>
                  updateLayer(
                    selected.id,
                    {
                      visible: v,
                    }
                  )
                }
              />

              {/* Position */}

              <div className="grid grid-cols-2 gap-2">
                <Field
                  label="X"
                  type="number"
                  value={String(
                    selected.x
                  )}
                  onChange={(v) =>
                    updateLayer(
                      selected.id,
                      {
                        x:
                          Number(v) ||
                          0,
                      }
                    )
                  }
                />

                <Field
                  label="Y"
                  type="number"
                  value={String(
                    selected.y
                  )}
                  onChange={(v) =>
                    updateLayer(
                      selected.id,
                      {
                        y:
                          Number(v) ||
                          0,
                      }
                    )
                  }
                />
              </div>

              <Field
                label="Angle (°)"
                type="number"
                value={String(
                  (selected as any).rotation ?? 0
                )}
                onChange={(v) =>
                  updateLayer(selected.id, {
                    rotation: Number(v) || 0,
                  } as any)
                }
              />

              {/* Text */}

              {selected.type ===
                "text" && (
                <>
                  <Field
                    label="Content ({{name}} {{role}} {{tokenId}} {{year}} {{category}} {{linkedin}} {{other}})"
                    value={
                      selected.content
                    }
                    onChange={(v) =>
                      updateLayer(
                        selected.id,
                        {
                          content: v,
                        }
                      )
                    }
                  />

                  <div>
                    <label className="block text-[11px] text-gray-400 mb-0.5">
                      Font
                    </label>

                    <select
                      value={
                        selected.fontFamily ||
                        config.fontFamily ||
                        "Inter"
                      }
                      onChange={(e) =>
                        updateLayer(
                          selected.id,
                          {
                            fontFamily:
                              e.target
                                .value,
                          }
                        )
                      }
                      className="input"
                      style={{
                        fontFamily:
                          selected.fontFamily ||
                          config.fontFamily ||
                          "Inter",
                      }}
                    >
                      {TICKET_FONTS.map(
                        (f) => (
                          <option
                            key={f}
                            value={f}
                            style={{
                              fontFamily:
                                f,
                            }}
                          >
                            {f}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <Field
                    label="Font size"
                    type="number"
                    value={String(
                      selected.fontSize
                    )}
                    onChange={(v) =>
                      updateLayer(
                        selected.id,
                        {
                          fontSize:
                            Number(
                              v
                            ) || 16,
                        }
                      )
                    }
                  />

                  <ColorField
                    label="Color"
                    value={
                      selected.color
                    }
                    onChange={(v) =>
                      updateLayer(
                        selected.id,
                        {
                          color: v,
                        }
                      )
                    }
                  />

                  <Field
                    label="Font weight"
                    type="number"
                    value={String(
                      selected.fontWeight ??
                        700
                    )}
                    onChange={(v) =>
                      updateLayer(
                        selected.id,
                        {
                          fontWeight:
                            Number(
                              v
                            ) || 700,
                        }
                      )
                    }
                  />

                  <select
                    value={
                      selected.textTransform ||
                      "none"
                    }
                    onChange={(e) =>
                      updateLayer(
                        selected.id,
                        {
                          textTransform:
                            e.target
                              .value as
                              | "none"
                              | "uppercase",
                        }
                      )
                    }
                    className="input"
                  >
                    <option value="none">
                      Normal case
                    </option>

                    <option value="uppercase">
                      Uppercase
                    </option>
                  </select>
                </>
              )}

              {/* Image */}

              {selected.type ===
                "image" && (
                <>
                  <select
                    value={
                      selected.src ===
                      "avatar"
                        ? "avatar"
                        : selected.src ===
                          "company_logo"
                        ? "company_logo"
                        : "url"
                    }
                    onChange={(e) => {
                      const v = e.target.value;
                      updateLayer(selected.id, {
                        src:
                          v === "avatar"
                            ? "avatar"
                            : v === "company_logo"
                            ? "company_logo"
                            : selected.src === "avatar" ||
                              selected.src === "company_logo"
                            ? ""
                            : selected.src || "",
                      });
                    }}
                    className="input"
                  >
                    <option value="avatar">
                      Person avatar
                    </option>

                    <option value="company_logo">
                      Company logo
                    </option>

                    <option value="url">
                      Custom URL
                    </option>
                  </select>

                  {selected.src !==
                    "avatar" &&
                    selected.src !==
                      "company_logo" && (
                      <ImagePicker
                        label="Custom image URL"
                        value={
                          selected.src === "avatar" ||
                          selected.src === "company_logo"
                            ? ""
                            : selected.src || ""
                        }
                        onChange={(v) =>
                          updateLayer(selected.id, { src: v })
                        }
                        imageFiles={imageFiles}
                      />
                    )}

                  <div className="grid grid-cols-2 gap-2">
                    <Field
                      label="W"
                      type="number"
                      value={String(
                        selected.width
                      )}
                      onChange={(v) =>
                        updateLayer(
                          selected.id,
                          {
                            width:
                              Number(
                                v
                              ) || 88,
                          }
                        )
                      }
                    />

                    <Field
                      label="H"
                      type="number"
                      value={String(
                        selected.height
                      )}
                      onChange={(v) =>
                        updateLayer(
                          selected.id,
                          {
                            height:
                              Number(
                                v
                              ) || 88,
                          }
                        )
                      }
                    />
                  </div>

                  <select
                    value={
                      (selected.borderRadius ??
                        0) >= 999
                        ? "circle"
                        : "square"
                    }
                    onChange={(e) =>
                      updateLayer(
                        selected.id,
                        {
                          borderRadius:
                            e.target
                              .value ===
                            "circle"
                              ? 999
                              : 12,
                        }
                      )
                    }
                    className="input"
                  >
                    <option value="circle">
                      Circle
                    </option>

                    <option value="square">
                      Rounded square
                    </option>
                  </select>

                  <div className="grid grid-cols-2 gap-2">
                    <Field
                      label="Border width (0 = none)"
                      type="number"
                      value={String(
                        selected.borderWidth ?? 0
                      )}
                      onChange={(v) =>
                        updateLayer(selected.id, {
                          borderWidth: Math.max(
                            0,
                            Number(v) || 0
                          ),
                        })
                      }
                    />
                    <div />
                  </div>

                  {(selected.borderWidth ?? 0) > 0 && (
                    <ColorField
                      label="Border color"
                      value={
                        selected.borderColor ||
                        "rgba(91,154,255,0.6)"
                      }
                      onChange={(v) =>
                        updateLayer(selected.id, {
                          borderColor: v,
                        })
                      }
                    />
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      updateLayer(selected.id, {
                        borderWidth: 0,
                      })
                    }
                    className="w-full text-xs py-2 rounded-lg bg-white/10 hover:bg-white/15"
                  >
                    Remove border
                  </button>
                </>
              )}
            </>
          )}

          {/* Preview */}

          {previewUrl && (
            <div className="pt-4 border-t border-white/10 space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#7eb0ff]">
                PNG output
              </h2>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="PNG"
                className="w-full rounded-lg shadow-lg"
              />

              <a
                href={previewUrl}
                download={`ticket-${tokenId}.png`}
                className="text-xs text-[#5b9aff] hover:underline"
              >
                Download PNG →
              </a>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          background: #162d4a;
          border: 1px solid
            rgba(255, 255, 255, 0.1);
          border-radius: 0.5rem;
          padding: 0.5rem 0.65rem;
          font-size: 0.8rem;
          color: white;
          outline: none;
        }

        .input:focus {
          border-color: #5b9aff;
        }
      `}</style>
    </div>
  );
}

function ImagePicker({
  label,
  value,
  onChange,
  imageFiles,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  imageFiles: string[];
}) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] text-gray-400 mb-0.5">
        {label}
      </label>

      {/* Free-text URL — always editable */}
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onChange(e.target.value.trim())}
        placeholder="/images/filename.png or https://…"
        className="input"
        autoComplete="off"
      />

      {/* Thumbnail grid from public/images */}
      {imageFiles.length > 0 ? (
        <>
          <p className="text-[10px] text-gray-500">
            Click to use ({imageFiles.length} in /images)
          </p>
          <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto rounded-lg border border-white/10 p-1.5 bg-black/20">
            {imageFiles.map((file) => {
              const url = `/images/${file}`;
              const isSelected = value === url;
              return (
                <button
                  key={file}
                  type="button"
                  title={file}
                  onClick={() => onChange(url)}
                  className={`relative aspect-square rounded overflow-hidden border-2 transition ${
                    isSelected
                      ? "border-[#5b9aff] ring-1 ring-[#5b9aff]/50"
                      : "border-transparent hover:border-white/30"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={file}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.opacity = "0.3";
                    }}
                  />
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <p className="text-[10px] text-amber-400/80">
          No images loaded. Put files in public/images and ensure /api/images works.
        </p>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-bold uppercase tracking-wider text-[#7eb0ff]">
        {title}
      </h2>

      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] text-gray-400 mb-0.5">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="input"
      />
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] text-gray-400 mb-0.5">
        {label}
      </label>

      <div className="flex gap-2">
        <input
          type="color"
          value={
            value.startsWith("#")
              ? value.slice(0, 7)
              : "#ffffff"
          }
          onChange={(e) =>
            onChange(e.target.value)
          }
          className="w-9 h-9 rounded cursor-pointer border-0 bg-transparent"
        />

        <input
          type="text"
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
          className="input flex-1"
        />
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <span className="text-sm text-gray-300">
        {label}
      </span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(e) =>
          onChange(e.target.checked)
        }
        className="w-4 h-4 accent-[#1e63f1]"
      />
    </label>
  );
}
