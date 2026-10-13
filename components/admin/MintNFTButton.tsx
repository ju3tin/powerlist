
"use client";

import { useEffect, useState } from "react";
import {
  Eye,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Ticket,
} from "lucide-react";
import type { TicketConfig } from "@/lib/ticketTypes";

type MintableProfile = {
  _id: string;
  title?: string;
  artist_title?: string;
  power_list_category?: string;
  featured_image?: string;
  company_logo?: string;
  social_icons?: {
    icon_type?: string;
    social_network_url?: string;
  }[];
  other?: {
    other_type?: string;
    other_type_value?: string;
  }[];
};

type MintNFTButtonProps = {
  profile: MintableProfile;
  tokenId?: string;
};

type ConfigResponse = {
  config?: TicketConfig;
  ticketConfig?: TicketConfig;
  success?: boolean;
  error?: string;
};

function getLinkedInUrl(profile: MintableProfile): string {
  return (
    profile.social_icons?.find((item) =>
      item.icon_type?.toLowerCase().includes("linkedin")
    )?.social_network_url || ""
  );
}

function getOtherText(profile: MintableProfile): string {
  return (
    profile.other
      ?.filter((item) => item.other_type_value?.trim())
      .map((item) => {
        const type = item.other_type?.trim();
        const value = item.other_type_value?.trim();
        return type ? `${type}: ${value}` : value;
      })
      .join(" · ") || ""
  );
}

/**
 * Hides configured text fields without changing the saved template.
 * Only the per-preview copy of the config is modified.
 */
function applyVisibility(
  config: TicketConfig,
  options: {
    showName: boolean;
    showJobTitle: boolean;
    showCategory: boolean;
  }
): TicketConfig {
  const copy = JSON.parse(JSON.stringify(config)) as TicketConfig;

  const hiddenVariables: string[] = [];

  if (!options.showName) hiddenVariables.push("name");
  if (!options.showJobTitle) hiddenVariables.push("role");
  if (!options.showCategory) hiddenVariables.push("category");

  const layers = (copy as any).layers;

  if (!Array.isArray(layers)) return copy;

  for (const layer of layers) {
    if (layer?.type !== "text" || typeof layer.content !== "string") {
      continue;
    }

    for (const variable of hiddenVariables) {
      const pattern = new RegExp(`\\{\\{\\s*${variable}\\s*\\}\\}`, "g");
      layer.content = layer.content.replace(pattern, "");
    }
  }

  return copy;
}

export default function MintNFTButton({
  profile,
  tokenId = "001",
}: MintNFTButtonProps) {
  const [open, setOpen] = useState(false);

  const [name, setName] = useState(profile.title || "");
  const [jobTitle, setJobTitle] = useState(profile.artist_title || "");
  const [category, setCategory] = useState(
    profile.power_list_category || ""
  );
  const [imageUrl, setImageUrl] = useState(
    profile.featured_image || ""
  );
  const [companyLogo, setCompanyLogo] = useState(
    profile.company_logo || ""
  );
  const [linkedinUrl, setLinkedinUrl] = useState(
    getLinkedInUrl(profile)
  );
  const [wallet, setWallet] = useState("");
  const [currentTokenId, setCurrentTokenId] = useState(tokenId);
  const [year, setYear] = useState("2026");

  const [showName, setShowName] = useState(true);
  const [showJobTitle, setShowJobTitle] = useState(true);
  const [showCategory, setShowCategory] = useState(true);

  const [config, setConfig] = useState<TicketConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [configError, setConfigError] = useState("");

  const [previewUrl, setPreviewUrl] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [demoConfirmed, setDemoConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!open || config) return;

    let cancelled = false;

    async function loadConfig() {
      setConfigLoading(true);
      setConfigError("");

      try {
        const response = await fetch("/api/ticket-config", {
          cache: "no-store",
        });

        const data = (await response.json()) as ConfigResponse;

        if (!response.ok) {
          throw new Error(
            data.error || "Could not load the saved ticket design."
          );
        }

        // Supports APIs returning { config }, { ticketConfig }, or the
        // config object directly.
        const loadedConfig =
          data.config ||
          data.ticketConfig ||
          (data as unknown as TicketConfig);

        if (
          !loadedConfig ||
          !Array.isArray((loadedConfig as any).layers)
        ) {
          throw new Error(
            "The ticket-config API did not return a valid ticket design."
          );
        }

        if (!cancelled) {
          setConfig(loadedConfig);
        }
      } catch (err) {
        if (!cancelled) {
          setConfigError(
            err instanceof Error
              ? err.message
              : "Could not load the saved ticket design."
          );
        }
      } finally {
        if (!cancelled) setConfigLoading(false);
      }
    }

    loadConfig();

    return () => {
      cancelled = true;
    };
  }, [open, config]);

  function clearPreview() {
    setPreviewUrl((previous) => {
      if (previous.startsWith("blob:")) {
        URL.revokeObjectURL(previous);
      }
      return "";
    });

    setDemoConfirmed(false);
    setNotice("");
    setError("");
  }

  function isValidWalletAddress(value: string) {
    return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
  }

  function getPayload() {
    if (!config) {
      throw new Error("The saved ticket design has not loaded yet.");
    }

    const previewConfig = applyVisibility(config, {
      showName,
      showJobTitle,
      showCategory,
    });

    return {
      // These are the same fields used by the Ticket Designer preview API.
      name: name.trim(),
      tokenId: currentTokenId.trim(),
      imageUrl: imageUrl.trim() || undefined,
      role: jobTitle.trim(),
      category: category.trim(),
      year: year.trim() || "2026",
      companyLogo: companyLogo.trim() || undefined,
      linkedinUrl: linkedinUrl.trim() || undefined,
      other: getOtherText(profile),
      config: previewConfig,
    };
  }

  async function handlePreview() {
    setError("");
    setNotice("");
    setDemoConfirmed(false);

    if (!name.trim()) {
      setError("Please enter the recipient's name.");
      return;
    }


    if (!currentTokenId.trim()) {
      setError("Please enter a token ID.");
      return;
    }

    if (configLoading) {
      setError("Please wait for the ticket design to load.");
      return;
    }

    if (configError || !config) {
      setError(configError || "The saved ticket design has not loaded.");
      return;
    }

    setPreviewLoading(true);

    try {
      const response = await fetch("/api/preview-ticket2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify(getPayload()),
      });

      if (!response.ok) {
        let message = `Preview failed (${response.status}).`;

        try {
          const data = await response.json();
          if (data.error) message = data.error;
        } catch {
          const text = await response.text().catch(() => "");
          if (text) message = text;
        }

        throw new Error(message);
      }

      const contentType =
        response.headers.get("content-type") || "";

      let nextPreviewUrl = "";

      if (contentType.includes("image/")) {
        const blob = await response.blob();
        nextPreviewUrl = URL.createObjectURL(blob);
      } else if (contentType.includes("application/json")) {
        const data = await response.json();

        if (typeof data.imageUrl === "string") {
          nextPreviewUrl = data.imageUrl;
        } else if (typeof data.url === "string") {
          nextPreviewUrl = data.url;
        } else if (typeof data.image === "string") {
          nextPreviewUrl = data.image.startsWith("data:")
            ? data.image
            : `data:image/png;base64,${data.image}`;
        } else {
          throw new Error(
            data.error ||
              "The preview API did not return an image."
          );
        }
      } else {
        throw new Error(
          `Unexpected preview response type: ${
            contentType || "unknown"
          }.`
        );
      }

      setPreviewUrl((previous) => {
        if (previous.startsWith("blob:")) {
          URL.revokeObjectURL(previous);
        }
        return nextPreviewUrl;
      });

      setNotice("Ticket preview generated from the saved ticket design.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate ticket preview."
      );
    } finally {
      setPreviewLoading(false);
    }
  }

  function handleFakeMint() {
    setError("");
    setNotice("");
    setDemoConfirmed(false);
  
    // A preview must exist before proceeding to mint.
    if (!previewUrl) {
      setError("Generate the ticket preview before minting.");
      return;
    }
  
    // Wallet validation happens only when the user clicks Final Mint.
    if (!isValidWalletAddress(wallet)) {
      setError(
        "Enter a valid wallet address (0x followed by 40 hexadecimal characters) before minting."
      );
      return;
    }
  
    // This is still a demo, not a real blockchain transaction.
    setDemoConfirmed(true);
    setNotice(
      "Demo complete. No NFT was minted and no blockchain transaction was sent."
    );
  }

  function updateField(setter: (value: string) => void, value: string) {
    setter(value);
    clearPreview();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setError("");
          setNotice("");
        }}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
      >
        <Ticket size={16} />
        Preview Ticket
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false);
            }
          }}
        >
          <div className="my-auto w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  NFT Ticket Preview
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Uses the saved design from the Ticket Designer.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close ticket preview"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={22} />
              </button>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-2">
              <div className="space-y-4">
                {configLoading && (
                  <div className="flex items-center gap-2 rounded-lg border bg-gray-50 p-3 text-sm text-gray-600">
                    <Loader2 size={17} className="animate-spin" />
                    Loading saved ticket design...
                  </div>
                )}

                {configError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {configError}
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Recipient name
                  </label>
                  <input
                    value={name}
                    onChange={(e) => updateField(setName, e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-gray-900 outline-none focus:border-indigo-500"
                    placeholder="Recipient name"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Job title / role
                  </label>
                  <input
                    value={jobTitle}
                    onChange={(e) =>
                      updateField(setJobTitle, e.target.value)
                    }
                    className="w-full rounded-lg border px-3 py-2 text-gray-900 outline-none focus:border-indigo-500"
                    placeholder="Job title"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <input
                    value={category}
                    onChange={(e) =>
                      updateField(setCategory, e.target.value)
                    }
                    className="w-full rounded-lg border px-3 py-2 text-gray-900 outline-none focus:border-indigo-500"
                    placeholder="Powerlist category"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Recipient image URL
                  </label>
                  <input
                    value={imageUrl}
                    onChange={(e) =>
                      updateField(setImageUrl, e.target.value)
                    }
                    className="w-full rounded-lg border px-3 py-2 text-gray-900 outline-none focus:border-indigo-500"
                    placeholder="/images/profile.png or https://..."
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Company logo URL
                  </label>
                  <input
                    value={companyLogo}
                    onChange={(e) =>
                      updateField(setCompanyLogo, e.target.value)
                    }
                    className="w-full rounded-lg border px-3 py-2 text-gray-900 outline-none focus:border-indigo-500"
                    placeholder="/images/company.png or https://..."
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    LinkedIn profile URL
                  </label>
                  <input
                    value={linkedinUrl}
                    onChange={(e) =>
                      updateField(setLinkedinUrl, e.target.value)
                    }
                    className="w-full rounded-lg border px-3 py-2 text-gray-900 outline-none focus:border-indigo-500"
                    placeholder="https://www.linkedin.com/in/..."
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Year
                  </label>
                  <input
                    value={year}
                    onChange={(e) => updateField(setYear, e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-gray-900 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Recipient wallet address
                  </label>
                  <input
                    value={wallet}
                    onChange={(e) =>
                      updateField(setWallet, e.target.value)
                    }
                    className="w-full rounded-lg border px-3 py-2 font-mono text-sm text-gray-900 outline-none focus:border-indigo-500"
                    placeholder="0x..."
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Token ID
                  </label>
                  <input
                    value={currentTokenId}
                    onChange={(e) =>
                      updateField(setCurrentTokenId, e.target.value)
                    }
                    className="w-full rounded-lg border px-3 py-2 text-gray-900 outline-none focus:border-indigo-500"
                    placeholder="001"
                  />
                </div>

                <div className="rounded-lg border bg-gray-50 p-4">
                  <p className="mb-3 text-sm font-semibold text-gray-800">
                    Show on ticket
                  </p>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={showName}
                        onChange={(e) => {
                          setShowName(e.target.checked);
                          clearPreview();
                        }}
                      />
                      Recipient name
                    </label>

                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={showJobTitle}
                        onChange={(e) => {
                          setShowJobTitle(e.target.checked);
                          clearPreview();
                        }}
                      />
                      Job title
                    </label>

                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={showCategory}
                        onChange={(e) => {
                          setShowCategory(e.target.checked);
                          clearPreview();
                        }}
                      />
                      Category
                    </label>
                  </div>
                </div>

                {error && (
                  <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 shrink-0" size={18} />
                    <span className="break-words">{error}</span>
                  </div>
                )}

                {notice && !error && (
                  <div className="flex gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                    <CheckCircle className="mt-0.5 shrink-0" size={18} />
                    <span>{notice}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handlePreview}
                  disabled={previewLoading || configLoading || !config}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {previewLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Generating preview...
                    </>
                  ) : (
                    <>
                      <Eye size={18} />
                      Generate Ticket Preview
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleFakeMint}
                  disabled={!previewUrl || previewLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-400 bg-gray-100 px-4 py-3 font-semibold text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Ticket size={18} />
                  Final Mint (Demo Only)
                </button>

                <p className="text-center text-xs text-gray-500">
                  Demo only. No NFT is minted and no blockchain transaction
                  is sent.
                </p>
              </div>

              <div className="flex min-h-[420px] flex-col rounded-xl border bg-gray-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">
                    Ticket preview
                  </h3>
                  {previewUrl && (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                      Generated
                    </span>
                  )}
                </div>

                {previewUrl ? (
                  <div className="flex flex-1 items-center justify-center">
                    <img
                      src={previewUrl}
                      alt={`Ticket preview for ${name}`}
                      className="max-h-[650px] w-full rounded-lg object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center text-center text-gray-400">
                    <Ticket size={52} strokeWidth={1.2} />
                    <p className="mt-4 font-medium text-gray-600">
                      No preview generated yet
                    </p>
                    <p className="mt-1 max-w-xs text-sm">
                      Generate a preview to see the recipient details on
                      your saved ticket design.
                    </p>
                  </div>
                )}

                {demoConfirmed && (
                  <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
                    <p className="font-semibold text-amber-900">
                      Demo mint completed
                    </p>
                    <p className="mt-1 text-sm text-amber-800">
                      This is only a visual confirmation. No NFT exists on
                      Avalanche as a result of this action.
                    </p>
                    <p className="mt-2 text-xs text-amber-800">
                      Recipient: {name} · Token ID: {currentTokenId}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end border-t bg-gray-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border bg-white px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
