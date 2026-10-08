"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

type Stage =
  | "form"
  | "preview"
  | "ipfs"
  | "minted";

type TicketResult = {
  cid: string;
  url: string;
};

type MintResult = {
  success: boolean;
  txHash: string;
  tokenId: string | null;
  image: string;
  blockNumber: string;
};

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at 10% 10%, rgba(30,99,241,0.16), transparent 30%), radial-gradient(circle at 90% 90%, rgba(91,154,255,0.10), transparent 30%), #07111f",
    color: "#ffffff",
    padding: "40px 20px 70px",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  },

  container: {
    width: "100%",
    maxWidth: "1180px",
    margin: "0 auto",
  },

  header: {
    marginBottom: "35px",
  },

  brandRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "45px",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  logo: {
    width: "46px",
    height: "46px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg, #1e63f1, #5b9aff)",
    boxShadow:
      "0 10px 35px rgba(30,99,241,0.35)",
    fontSize: "14px",
    fontWeight: 900,
  },

  brandName: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#ffffff",
  },

  brandSub: {
    marginTop: "3px",
    fontSize: "12px",
    color: "#6f8198",
  },

  network: {
    padding: "9px 14px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    color: "#91a4bb",
    fontSize: "12px",
    fontWeight: 600,
  },

  eyebrow: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "7px 12px",
    borderRadius: "999px",
    border: "1px solid rgba(91,154,255,0.20)",
    background: "rgba(30,99,241,0.10)",
    color: "#73a5ff",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.14em",
  },

  dot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#5b9aff",
    boxShadow: "0 0 10px rgba(91,154,255,0.9)",
  },

  title: {
    margin: "18px 0 0",
    fontSize: "clamp(36px, 6vw, 64px)",
    lineHeight: 1.02,
    letterSpacing: "-0.045em",
    fontWeight: 800,
  },

  titleGradient: {
    background:
      "linear-gradient(90deg, #5b9aff, #9cc4ff, #7dd3fc)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  subtitle: {
    maxWidth: "700px",
    marginTop: "20px",
    color: "#8496ab",
    fontSize: "15px",
    lineHeight: 1.8,
  },

  progress: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "8px",
    padding: "8px",
    marginBottom: "28px",
    borderRadius: "18px",
    border:
      "1px solid rgba(255,255,255,0.08)",
    background:
      "rgba(255,255,255,0.035)",
  },

  progressItem: {
    padding: "13px 8px",
    borderRadius: "13px",
    textAlign: "center" as const,
  },

  progressNumber: {
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.1em",
  },

  progressLabel: {
    marginTop: "5px",
    fontSize: "12px",
    fontWeight: 600,
  },

  card: {
    border:
      "1px solid rgba(255,255,255,0.09)",
    background:
      "linear-gradient(145deg, rgba(255,255,255,0.055), rgba(255,255,255,0.025))",
    borderRadius: "28px",
    boxShadow:
      "0 30px 80px rgba(0,0,0,0.28)",
    backdropFilter: "blur(20px)",
  },

  formCard: {
    padding: "32px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1fr) 370px",
    gap: "28px",
    alignItems: "start",
  },

  stepLabel: {
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.18em",
    color: "#5b9aff",
    textTransform: "uppercase" as const,
  },

  sectionTitle: {
    margin: "8px 0 0",
    fontSize: "27px",
    fontWeight: 800,
    letterSpacing: "-0.02em",
  },

  sectionText: {
    marginTop: "8px",
    color: "#718399",
    fontSize: "13px",
    lineHeight: 1.7,
  },

  field: {
    marginTop: "20px",
  },

  label: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "9px",
    fontSize: "13px",
    fontWeight: 700,
    color: "#d8e1ed",
  },

  optional: {
    fontSize: "11px",
    fontWeight: 400,
    color: "#53657a",
  },

  input: {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "14px 15px",
    borderRadius: "13px",
    border:
      "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.20)",
    color: "#ffffff",
    outline: "none",
    fontSize: "13px",
    transition: "all 0.2s ease",
  },

  button: {
    width: "100%",
    border: "none",
    borderRadius: "14px",
    padding: "15px 18px",
    marginTop: "25px",
    background:
      "linear-gradient(135deg, #1e63f1, #3f82ff)",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow:
      "0 15px 35px rgba(30,99,241,0.28)",
  },

  secondaryButton: {
    width: "100%",
    border:
      "1px solid rgba(255,255,255,0.10)",
    borderRadius: "14px",
    padding: "14px 18px",
    background:
      "rgba(255,255,255,0.035)",
    color: "#b8c5d5",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
  },

  infoCard: {
    padding: "26px",
    borderRadius: "25px",
    border:
      "1px solid rgba(91,154,255,0.12)",
    background:
      "linear-gradient(145deg, rgba(30,99,241,0.10), rgba(255,255,255,0.025))",
  },

  iconBox: {
    width: "46px",
    height: "46px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "14px",
    background: "rgba(30,99,241,0.12)",
    fontSize: "20px",
    marginBottom: "18px",
  },

  infoTitle: {
    fontSize: "17px",
    fontWeight: 800,
  },

  infoText: {
    marginTop: "8px",
    color: "#72849a",
    fontSize: "13px",
    lineHeight: 1.7,
  },

  infoRow: {
    display: "flex",
    gap: "12px",
    marginTop: "18px",
  },

  infoNumber: {
    flexShrink: 0,
    width: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "9px",
    border:
      "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.035)",
    color: "#708196",
    fontSize: "10px",
    fontWeight: 800,
  },

  infoRowTitle: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#d8e1ed",
  },

  infoRowText: {
    marginTop: "3px",
    fontSize: "11px",
    lineHeight: 1.5,
    color: "#596c82",
  },

  previewCard: {
    padding: "25px",
  },

  previewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "25px",
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    padding: "7px 11px",
    borderRadius: "999px",
    background: "rgba(91,154,255,0.08)",
    border:
      "1px solid rgba(91,154,255,0.18)",
    color: "#82afff",
    fontSize: "10px",
    fontWeight: 800,
  },

  ticketOuter: {
    position: "relative" as const,
    maxWidth: "600px",
    margin: "0 auto",
  },

  ticketGlow: {
    position: "absolute" as const,
    inset: "-20px",
    background:
      "rgba(30,99,241,0.13)",
    filter: "blur(45px)",
    borderRadius: "40px",
  },

  ticketImage: {
    position: "relative" as const,
    display: "block",
    width: "100%",
    height: "auto",
    borderRadius: "17px",
    border:
      "1px solid rgba(255,255,255,0.12)",
    boxShadow:
      "0 35px 80px rgba(0,0,0,0.45)",
  },

  detailsCard: {
    padding: "24px",
  },

  detailLabel: {
    color: "#5d7086",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    marginBottom: "7px",
  },

  detailValue: {
    color: "#dbe5f1",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  mono: {
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    wordBreak: "break-all" as const,
  },

  cid: {
    padding: "12px",
    borderRadius: "12px",
    background: "rgba(0,0,0,0.22)",
    border:
      "1px solid rgba(255,255,255,0.07)",
    color: "#9aaabd",
    fontSize: "11px",
    lineHeight: 1.6,
    wordBreak: "break-all" as const,
  },

  success: {
    padding: "30px",
    borderRadius: "28px",
    border:
      "1px solid rgba(52,211,153,0.18)",
    background:
      "linear-gradient(145deg, rgba(52,211,153,0.06), rgba(255,255,255,0.025))",
  },

  successIcon: {
    width: "72px",
    height: "72px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: "rgba(52,211,153,0.10)",
    border:
      "1px solid rgba(52,211,153,0.20)",
    color: "#5ee0ae",
    fontSize: "30px",
  },

  error: {
    marginTop: "20px",
    padding: "15px",
    borderRadius: "14px",
    border:
      "1px solid rgba(248,113,113,0.15)",
    background: "rgba(248,113,113,0.06)",
    color: "#fca5a5",
    fontSize: "12px",
    lineHeight: 1.6,
  },

  status: {
    marginTop: "20px",
    padding: "14px 16px",
    borderRadius: "14px",
    border:
      "1px solid rgba(91,154,255,0.15)",
    background: "rgba(30,99,241,0.06)",
    color: "#9dbfff",
    fontSize: "12px",
  },

  footer: {
    marginTop: "45px",
    textAlign: "center" as const,
    color: "#3f5064",
    fontSize: "11px",
  },
};

export default function TicketTestPage() {
  const [name, setName] =
    useState("Jane Smith");

  const [wallet, setWallet] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [linkedinId, setLinkedinId] =
    useState("test-jane-001");

  const [tokenId, setTokenId] =
    useState("001");

  const [imageUrl, setImageUrl] =
    useState("");

  const [stage, setStage] =
    useState<Stage>("form");

  const [previewUrl, setPreviewUrl] =
    useState("");

  const [previewBlob, setPreviewBlob] =
    useState<Blob | null>(null);

  const [ticket, setTicket] =
    useState<TicketResult | null>(null);

  const [mint, setMint] =
    useState<MintResult | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [step, setStep] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function handleGenerate(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setTicket(null);
    setMint(null);
    setStep("Generating ticket...");

    try {
      if (!name.trim()) {
        throw new Error(
          "Please enter your name."
        );
      }

      if (!wallet.startsWith("0x")) {
        throw new Error(
          "Please enter a valid wallet address."
        );
      }

      if (wallet.length !== 42) {
        throw new Error(
          "Wallet address must be 42 characters."
        );
      }

      const params =
        new URLSearchParams();

      params.set(
        "name",
        name.trim()
      );

      params.set(
        "tokenId",
        tokenId.trim()
      );

      if (imageUrl.trim()) {
        params.set(
          "imageUrl",
          imageUrl.trim()
        );
      }

      const response =
        await fetch(
          `/api/ticket-test?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

      if (!response.ok) {
        let message =
          "Unable to generate ticket.";

        try {
          const data =
            await response.json();

          message =
            data.error || message;
        } catch {
          // Ignore non-JSON response.
        }

        throw new Error(message);
      }

      const blob =
        await response.blob();

      if (!blob.size) {
        throw new Error(
          "Generated ticket is empty."
        );
      }

      if (previewUrl) {
        URL.revokeObjectURL(
          previewUrl
        );
      }

      const url =
        URL.createObjectURL(blob);

      setPreviewBlob(blob);
      setPreviewUrl(url);
      setStage("preview");
      setStep(
        "Ticket generated successfully."
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload() {
    if (!previewBlob) {
      setError(
        "No ticket preview is available."
      );
      return;
    }

    setLoading(true);
    setError("");
    setStep(
      "Uploading approved ticket to IPFS..."
    );

    try {
      const formData =
        new FormData();

      formData.append(
        "action",
        "upload"
      );

      formData.append(
        "name",
        name.trim()
      );

      formData.append(
        "tokenId",
        tokenId.trim()
      );

      formData.append(
        "file",
        previewBlob,
        `ticket-${tokenId.trim()}.png`
      );

      const response =
        await fetch(
          "/api/ticket-test",
          {
            method: "POST",
            body: formData,
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "IPFS upload failed."
        );
      }

      if (!data.cid || !data.url) {
        throw new Error(
          "IPFS did not return a valid ticket URL."
        );
      }

      setTicket({
        cid: data.cid,
        url: data.url,
      });

      setStage("ipfs");
      setStep(
        "Ticket uploaded to IPFS successfully."
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "IPFS upload failed."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleMint() {
    if (!ticket?.url) {
      setError(
        "No IPFS ticket is available."
      );
      return;
    }

    setLoading(true);
    setError("");
    setStep(
      "Minting NFT on Avalanche Fuji..."
    );

    try {
      const response =
        await fetch(
          "/api/mint5",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              wallet:
                wallet.trim(),
              name:
                name.trim(),
              email:
                email.trim(),
              image:
                ticket.url,
              linkedinId:
                linkedinId.trim(),
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Mint failed."
        );
      }

      setMint(data);
      setStage("minted");
      setStep(
        "NFT successfully minted!"
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Mint failed."
      );
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    if (previewUrl) {
      URL.revokeObjectURL(
        previewUrl
      );
    }

    setPreviewUrl("");
    setPreviewBlob(null);
    setTicket(null);
    setMint(null);
    setError("");
    setStep("");
    setStage("form");
  }

  const stepNumber =
    stage === "form"
      ? 1
      : stage === "preview"
      ? 2
      : stage === "ipfs"
      ? 3
      : 4;

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        {/* HEADER */}

        <header style={styles.header}>
          <div style={styles.brandRow}>
            <div style={styles.brand}>
              <div style={styles.logo}>
                IF
              </div>

              <div>
                <div style={styles.brandName}>
                  innovate finance
                </div>

                <div style={styles.brandSub}>
                  Web3 Ticketing
                </div>
              </div>
            </div>

            <div style={styles.network}>
              Avalanche Fuji Testnet
            </div>
          </div>

          <div style={styles.eyebrow}>
            <span style={styles.dot} />
            NFT MINT TEST
          </div>

          <h1 style={styles.title}>
            Women in FinTech
            <br />

            <span style={styles.titleGradient}>
              Powerlist 2026
            </span>
          </h1>

          <p style={styles.subtitle}>
            Create your digital ticket, inspect it before
            anything is uploaded, approve the IPFS version,
            then mint your NFT on Avalanche Fuji.
          </p>
        </header>

        {/* PROGRESS */}

        <div style={styles.progress}>
          {[
            ["01", "Details"],
            ["02", "Preview"],
            ["03", "IPFS"],
            ["04", "Mint"],
          ].map(
            ([number, label], index) => {
              const active =
                index + 1 <= stepNumber;

              return (
                <div
                  key={number}
                  style={{
                    ...styles.progressItem,
                    background: active
                      ? "rgba(30,99,241,0.10)"
                      : "transparent",
                    color: active
                      ? "#82afff"
                      : "#45566b",
                  }}
                >
                  <div
                    style={{
                      ...styles.progressNumber,
                      color: active
                        ? "#5b9aff"
                        : "#45566b",
                    }}
                  >
                    {number}
                  </div>

                  <div style={styles.progressLabel}>
                    {label}
                  </div>
                </div>
              );
            }
          )}
        </div>

        {/* FORM */}

        {stage === "form" && (
          <div style={styles.grid}>
            <section
              style={{
                ...styles.card,
                ...styles.formCard,
              }}
            >
              <div>
                <div style={styles.stepLabel}>
                  Step 01
                </div>

                <h2 style={styles.sectionTitle}>
                  Ticket details
                </h2>

                <p style={styles.sectionText}>
                  Enter the attendee information used to
                  generate your ticket.
                </p>
              </div>

              <form
                onSubmit={handleGenerate}
              >
                <Field
                  label="Name"
                  value={name}
                  setValue={setName}
                  placeholder="Jane Smith"
                  disabled={loading}
                  required
                />

                <Field
                  label="Wallet address"
                  value={wallet}
                  setValue={setWallet}
                  placeholder="0x..."
                  disabled={loading}
                  required
                  mono
                />

                <Field
                  label="Email"
                  type="email"
                  value={email}
                  setValue={setEmail}
                  placeholder="jane@example.com"
                  disabled={loading}
                />

                <Field
                  label="LinkedIn ID"
                  value={linkedinId}
                  setValue={setLinkedinId}
                  placeholder="jane-smith"
                  disabled={loading}
                />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1fr 1fr",
                    gap: "18px",
                  }}
                >
                  <Field
                    label="Token ID"
                    value={tokenId}
                    setValue={setTokenId}
                    placeholder="001"
                    disabled={loading}
                    mono
                  />

                  <Field
                    label="Profile image URL"
                    value={imageUrl}
                    setValue={setImageUrl}
                    placeholder="https://..."
                    disabled={loading}
                    type="url"
                    optional
                  />
                </div>

                <button
                  type="submit"
                  disabled={
                    loading ||
                    !name.trim() ||
                    !wallet.trim()
                  }
                  style={{
                    ...styles.button,
                    opacity:
                      loading ||
                      !name.trim() ||
                      !wallet.trim()
                        ? 0.5
                        : 1,
                    cursor:
                      loading ||
                      !name.trim() ||
                      !wallet.trim()
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {loading
                    ? step || "Generating..."
                    : "Generate Ticket →"}
                </button>
              </form>

              {error && (
                <ErrorBox message={error} />
              )}
            </section>

            <aside>
              <div style={styles.infoCard}>
                <div style={styles.iconBox}>
                  🎟️
                </div>

                <div style={styles.infoTitle}>
                  Safe preview flow
                </div>

                <p style={styles.infoText}>
                  Your ticket is generated first and shown to
                  you before it is uploaded anywhere.
                </p>

                <InfoRow
                  number="01"
                  title="Generate"
                  text="Create the ticket image."
                />

                <InfoRow
                  number="02"
                  title="Review"
                  text="Inspect the exact ticket."
                />

                <InfoRow
                  number="03"
                  title="Approve"
                  text="Upload the approved image to IPFS."
                />

                <InfoRow
                  number="04"
                  title="Mint"
                  text="Mint using the IPFS image."
                />
              </div>

              <div
                style={{
                  ...styles.card,
                  marginTop: "18px",
                  padding: "22px",
                }}
              >
                <div style={styles.detailLabel}>
                  Network
                </div>

                <div
                  style={{
                    marginTop: "10px",
                    fontWeight: 700,
                  }}
                >
                  🔴 Avalanche Fuji
                </div>

                <div
                  style={{
                    marginTop: "5px",
                    fontSize: "11px",
                    color: "#52657b",
                  }}
                >
                  Testnet environment
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* PREVIEW */}

        {stage === "preview" && (
          <div style={styles.grid}>
            <section
              style={{
                ...styles.card,
                ...styles.previewCard,
              }}
            >
              <PreviewHeader
                step="Step 02"
                title="Review your ticket"
                description="Nothing has been uploaded to IPFS yet."
                badge="LOCAL PREVIEW"
              />

              <TicketPreview
                src={previewUrl}
                alt={`Ticket for ${name}`}
              />
            </section>

            <aside>
              <div style={styles.infoCard}>
                <div style={styles.iconBox}>
                  👀
                </div>

                <div style={styles.infoTitle}>
                  Check everything
                </div>

                <p style={styles.infoText}>
                  Make sure the name, profile image and ticket
                  design look correct before continuing.
                </p>
              </div>

              <div
                style={{
                  ...styles.card,
                  ...styles.detailsCard,
                  marginTop: "18px",
                }}
              >
                <TicketDetails
                  name={name}
                  tokenId={tokenId}
                  wallet={wallet}
                />
              </div>

              <button
                type="button"
                onClick={handleUpload}
                disabled={loading}
                style={{
                  ...styles.button,
                  marginTop: "18px",
                  opacity: loading ? 0.5 : 1,
                }}
              >
                {loading
                  ? "Uploading..."
                  : "Approve & Upload to IPFS →"}
              </button>

              <button
                type="button"
                onClick={reset}
                disabled={loading}
                style={{
                  ...styles.secondaryButton,
                  marginTop: "10px",
                }}
              >
                ← Edit Details
              </button>

              {error && (
                <ErrorBox message={error} />
              )}
            </aside>
          </div>
        )}

        {/* IPFS */}

        {stage === "ipfs" && ticket && (
          <div style={styles.grid}>
            <section
              style={{
                ...styles.card,
                ...styles.previewCard,
              }}
            >
              <PreviewHeader
                step="Step 03"
                title="IPFS ticket"
                description="This is the exact image that will be used for the NFT."
                badge="ON IPFS"
                green
              />

              <TicketPreview
                src={ticket.url}
                alt={`IPFS ticket for ${name}`}
              />
            </section>

            <aside>
              <div
                style={{
                  ...styles.infoCard,
                  borderColor:
                    "rgba(52,211,153,0.16)",
                  background:
                    "rgba(52,211,153,0.05)",
                }}
              >
                <div style={styles.iconBox}>
                  ✓
                </div>

                <div style={styles.infoTitle}>
                  Upload successful
                </div>

                <p style={styles.infoText}>
                  Your approved ticket is now publicly available
                  through IPFS.
                </p>
              </div>

              <div
                style={{
                  ...styles.card,
                  ...styles.detailsCard,
                  marginTop: "18px",
                }}
              >
                <div style={styles.detailLabel}>
                  IPFS CID
                </div>

                <div
                  style={{
                    ...styles.cid,
                    marginTop: "8px",
                  }}
                >
                  {ticket.cid}
                </div>

                <a
                  href={ticket.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
                    marginTop: "12px",
                    color: "#6fa4ff",
                    fontSize: "12px",
                    textDecoration: "none",
                  }}
                >
                  Open IPFS image ↗
                </a>
              </div>

              <div
                style={{
                  ...styles.card,
                  ...styles.detailsCard,
                  marginTop: "18px",
                }}
              >
                <TicketDetails
                  name={name}
                  tokenId={tokenId}
                  wallet={wallet}
                />
              </div>

              <button
                type="button"
                onClick={handleMint}
                disabled={loading}
                style={{
                  ...styles.button,
                  marginTop: "18px",
                  opacity: loading ? 0.5 : 1,
                }}
              >
                {loading
                  ? "Minting..."
                  : "Mint NFT →"}
              </button>

              <button
                type="button"
                onClick={reset}
                disabled={loading}
                style={{
                  ...styles.secondaryButton,
                  marginTop: "10px",
                }}
              >
                Don't Mint
              </button>

              {error && (
                <ErrorBox message={error} />
              )}
            </aside>
          </div>
        )}

        {/* MINTED */}

        {stage === "minted" && mint && (
          <section style={styles.success}>
            <div style={styles.successIcon}>
              ✓
            </div>

            <div
              style={{
                textAlign: "center",
                marginTop: "22px",
              }}
            >
              <div
                style={{
                  ...styles.stepLabel,
                  color: "#5ee0ae",
                }}
              >
                Step 04 · Complete
              </div>

              <h2
                style={{
                  margin: "8px 0 0",
                  fontSize: "32px",
                  fontWeight: 800,
                }}
              >
                NFT Minted Successfully
              </h2>

              <p
                style={{
                  maxWidth: "600px",
                  margin: "10px auto 0",
                  color: "#718399",
                  fontSize: "13px",
                  lineHeight: 1.7,
                }}
              >
                Your Women in FinTech Powerlist ticket has been
                minted on Avalanche Fuji.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "300px minmax(0, 1fr)",
                gap: "35px",
                marginTop: "35px",
                alignItems: "start",
              }}
            >
              <TicketPreview
                src={
                  ticket?.url ||
                  mint.image
                }
                alt={`Minted ticket for ${name}`}
              />

              <div>
                <ResultItem
                  label="Wallet"
                  value={wallet}
                  mono
                />

                <ResultItem
                  label="Transaction hash"
                  value={mint.txHash}
                  mono
                />

                <ResultItem
                  label="Block number"
                  value={mint.blockNumber}
                  mono
                />

                {mint.tokenId && (
                  <ResultItem
                    label="Token ID"
                    value={mint.tokenId}
                    mono
                  />
                )}

                <ResultItem
                  label="Token image"
                  value={mint.image}
                  mono
                  link={mint.image}
                />

                <button
                  type="button"
                  onClick={reset}
                  style={{
                    ...styles.button,
                    background:
                      "#ffffff",
                    color: "#07111f",
                    boxShadow: "none",
                    marginTop: "25px",
                  }}
                >
                  Create Another Test Ticket
                </button>
              </div>
            </div>
          </section>
        )}

        {loading && stage !== "form" && (
          <div style={styles.status}>
            {step}
          </div>
        )}

        <footer style={styles.footer}>
          Women in FinTech · Powerlist 2026 · Avalanche Fuji
          Testnet
        </footer>
      </div>
    </main>
  );
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function Field({
  label,
  value,
  setValue,
  placeholder,
  disabled,
  required,
  type = "text",
  mono = false,
  optional = false,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  type?: string;
  mono?: boolean;
  optional?: boolean;
}) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>
        <span>
          {label}

          {required && (
            <span
              style={{
                color: "#5b9aff",
                marginLeft: "4px",
              }}
            >
              *
            </span>
          )}
        </span>

        {optional && (
          <span style={styles.optional}>
            optional
          </span>
        )}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          setValue(event.target.value)
        }
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        style={{
          ...styles.input,
          fontFamily: mono
            ? "ui-monospace, SFMono-Regular, Menlo, monospace"
            : "inherit",
        }}
      />
    </div>
  );
}

function PreviewHeader({
  step,
  title,
  description,
  badge,
  green = false,
}: {
  step: string;
  title: string;
  description: string;
  badge: string;
  green?: boolean;
}) {
  return (
    <div style={styles.previewHeader}>
      <div>
        <div
          style={{
            ...styles.stepLabel,
            color: green
              ? "#5ee0ae"
              : "#5b9aff",
          }}
        >
          {step}
        </div>

        <h2 style={styles.sectionTitle}>
          {title}
        </h2>

        <p style={styles.sectionText}>
          {description}
        </p>
      </div>

      <div
        style={{
          ...styles.badge,
          color: green
            ? "#5ee0ae"
            : "#82afff",
          borderColor: green
            ? "rgba(52,211,153,0.18)"
            : "rgba(91,154,255,0.18)",
          background: green
            ? "rgba(52,211,153,0.06)"
            : "rgba(91,154,255,0.08)",
        }}
      >
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: green
              ? "#5ee0ae"
              : "#5b9aff",
          }}
        />

        {badge}
      </div>
    </div>
  );
}

function TicketPreview({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  return (
    <div style={styles.ticketOuter}>
      <div style={styles.ticketGlow} />

      <img
        src={src}
        alt={alt}
        style={styles.ticketImage}
      />
    </div>
  );
}

function InfoRow({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div style={styles.infoRow}>
      <div style={styles.infoNumber}>
        {number}
      </div>

      <div>
        <div style={styles.infoRowTitle}>
          {title}
        </div>

        <div style={styles.infoRowText}>
          {text}
        </div>
      </div>
    </div>
  );
}

function TicketDetails({
  name,
  tokenId,
  wallet,
}: {
  name: string;
  tokenId: string;
  wallet: string;
}) {
  return (
    <div>
      <div style={styles.detailLabel}>
        Ticket details
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "20px",
          padding: "12px 0",
          borderBottom:
            "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <span
          style={{
            color: "#5d7086",
            fontSize: "12px",
          }}
        >
          Name
        </span>

        <strong
          style={{
            color: "#dbe5f1",
            fontSize: "12px",
          }}
        >
          {name}
        </strong>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "20px",
          padding: "12px 0",
          borderBottom:
            "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <span
          style={{
            color: "#5d7086",
            fontSize: "12px",
          }}
        >
          Token
        </span>

        <span
          style={{
            ...styles.mono,
            color: "#aab9ca",
            fontSize: "12px",
          }}
        >
          #{tokenId}
        </span>
      </div>

      <div style={{ marginTop: "14px" }}>
        <div style={styles.detailLabel}>
          Wallet
        </div>

        <div
          style={{
            ...styles.cid,
            marginTop: "7px",
          }}
        >
          {wallet}
        </div>
      </div>
    </div>
  );
}

function ResultItem({
  label,
  value,
  mono = false,
  link,
}: {
  label: string;
  value: string;
  mono?: boolean;
  link?: string;
}) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <div style={styles.detailLabel}>
        {label}
      </div>

      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            ...styles.cid,
            display: "block",
            color: "#72a5ff",
            textDecoration: "none",
          }}
        >
          {value}
        </a>
      ) : (
        <div
          style={{
            ...styles.cid,
            fontFamily: mono
              ? "ui-monospace, SFMono-Regular, Menlo, monospace"
              : "inherit",
          }}
        >
          {value}
        </div>
      )}
    </div>
  );
}

function ErrorBox({
  message,
}: {
  message: string;
}) {
  return (
    <div style={styles.error}>
      <strong>
        Something went wrong
      </strong>

      <div
        style={{
          marginTop: "5px",
          wordBreak: "break-word",
        }}
      >
        {message}
      </div>
    </div>
  );
}