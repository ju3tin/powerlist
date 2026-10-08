"use client";

import { useEffect, useMemo, useState } from "react";

type Stage =
  | "details"
  | "checking-wallet"
  | "preview"
  | "ipfs"
  | "minting"
  | "minted";

type TicketData = {
  url: string;
  cid?: string;
};

type MintData = {
  success?: boolean;
  name?: string;
  txHash?: string;
  tokenURI?: string;
  image?: string;
  blockNumber?: string;
  error?: string;
};

export default function Page() {
  const [name, setName] = useState("Jane Smith");
  const [wallet, setWallet] = useState("");
  const [email, setEmail] = useState("");
  const [linkedinId, setLinkedinId] = useState("test-jane-001");
  const [tokenId, setTokenId] = useState("001");
  const [imageUrl, setImageUrl] = useState("");

  const [stage, setStage] = useState<Stage>("details");

  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [ipfsTicket, setIpfsTicket] = useState<TicketData | null>(null);
  const [mint, setMint] = useState<MintData | null>(null);

  const [error, setError] = useState("");
  const [walletStatus, setWalletStatus] = useState("");

  const [localPreviewUrl, setLocalPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  /*
   * Clean up object URLs when they are replaced/unmounted.
   */
  useEffect(() => {
    return () => {
      if (localPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  const walletIsValid = useMemo(() => {
    return /^0x[a-fA-F0-9]{40}$/.test(wallet.trim());
  }, [wallet]);

  /*
   * ------------------------------------------------------------
   * STEP 1 + STEP 2
   *
   * Check wallet BEFORE generating/uploading anything.
   * ------------------------------------------------------------
   */
  async function handleDetailsSubmit() {
    setError("");
    setWalletStatus("");
    setTicket(null);
    setIpfsTicket(null);
    setMint(null);

    const cleanWallet = wallet.trim();

    if (!name.trim()) {
      setError("Please enter the attendee name.");
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(cleanWallet)) {
      setError("Please enter a valid Avalanche wallet address.");
      return;
    }

    try {
      setStage("checking-wallet");
      setWalletStatus("Checking wallet eligibility on Avalanche Fuji...");

      const response = await fetch(
        `/api/check-wallet?wallet=${encodeURIComponent(cleanWallet)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || "Unable to check wallet eligibility."
        );
      }

      /*
       * IMPORTANT:
       * Do not generate or upload the ticket if this wallet
       * has already minted.
       */
      if (result.hasMinted) {
        setStage("details");
        setWalletStatus("");

        setError(
          "This wallet already has a Women in FinTech NFT. No ticket was uploaded to IPFS."
        );

        return;
      }

      if (result.remainingSupply === "0") {
        setStage("details");
        setWalletStatus("");

        setError(
          "The NFT collection is sold out. No ticket was uploaded to IPFS."
        );

        return;
      }

      setWalletStatus(
        `Wallet eligible. ${result.remainingSupply} NFT(s) remaining.`
      );

      /*
       * Now generate the ticket locally.
       *
       * Nothing has been uploaded to IPFS yet.
       */
      await generateLocalTicket(cleanWallet);
    } catch (err: any) {
      console.error("Wallet check error:", err);

      setStage("details");
      setWalletStatus("");

      setError(
        err?.message || "Unable to check this wallet. Please try again."
      );
    }
  }

  /*
   * ------------------------------------------------------------
   * STEP 3
   *
   * Generate the ticket image locally.
   * This uses your existing /api/ticket-test GET endpoint.
   *
   * IMPORTANT:
   * We do NOT upload anything here.
   * ------------------------------------------------------------
   */
  async function generateLocalTicket(cleanWallet: string) {
    try {
      setError("");

      const params = new URLSearchParams({
        name: name.trim(),
        tokenId: tokenId.trim() || "001",
      });

      if (imageUrl.trim()) {
        params.set("imageUrl", imageUrl.trim());
      }

      const response = await fetch(
        `/api/ticket-test?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        const text = await response.text();

        let message = "Unable to generate ticket.";

        try {
          const parsed = JSON.parse(text);
          message = parsed?.error || message;
        } catch {
          // Response wasn't JSON.
        }

        throw new Error(message);
      }

      const blob = await response.blob();

      if (!blob.type.startsWith("image/")) {
        throw new Error("Ticket generator did not return an image.");
      }

      /*
       * Create a local browser URL.
       * This is only for previewing the generated ticket.
       */
      const objectUrl = URL.createObjectURL(blob);

      setLocalPreviewUrl((previous) => {
        if (previous.startsWith("blob:")) {
          URL.revokeObjectURL(previous);
        }

        return objectUrl;
      });

      /*
       * We keep the preview URL.
       * The actual PNG blob is recreated when the user approves it
       * by fetching this local object URL.
       */
      setTicket({
        url: objectUrl,
      });

      setWalletStatus(
        `Wallet ${shortWallet(cleanWallet)} is eligible. Review your ticket below.`
      );

      setStage("preview");
    } catch (err: any) {
      console.error("Ticket generation error:", err);

      setStage("details");

      setError(
        err?.message || "Unable to generate the ticket preview."
      );
    }
  }

  /*
   * ------------------------------------------------------------
   * STEP 4
   *
   * User approves the exact ticket they saw.
   *
   * Only NOW do we upload it to IPFS.
   * ------------------------------------------------------------
   */
  async function approveAndUpload() {
    if (!localPreviewUrl) {
      setError("There is no ticket preview to upload.");
      return;
    }

    setError("");
    setUploading(true);

    try {
      /*
       * Fetch the exact PNG represented by the preview.
       */
      const previewResponse = await fetch(localPreviewUrl);

      if (!previewResponse.ok) {
        throw new Error("Unable to read the approved ticket preview.");
      }

      const previewBlob = await previewResponse.blob();

      if (!previewBlob.type.startsWith("image/")) {
        throw new Error("The approved ticket is not a valid image.");
      }

      /*
       * Send the exact preview PNG to your ticket-test upload route.
       */
      const formData = new FormData();

      formData.append("action", "upload");
      formData.append("name", name.trim());
      formData.append("tokenId", tokenId.trim() || "001");

      formData.append(
        "file",
        previewBlob,
        `${safeFilename(name)}-ticket.png`
      );

      const response = await fetch("/api/ticket-test", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || "Ticket upload to IPFS failed."
        );
      }

      if (!result?.url) {
        throw new Error(
          "IPFS upload succeeded but no IPFS URL was returned."
        );
      }

      /*
       * Store the uploaded ticket.
       */
      setIpfsTicket({
        url: result.url,
        cid: result.cid,
      });

      /*
       * Combined stage:
       * IPFS preview + Mint button.
       */
      setStage("ipfs");
    } catch (err: any) {
      console.error("IPFS upload error:", err);

      setError(
        err?.message ||
          "Unable to upload the approved ticket to IPFS."
      );
    } finally {
      setUploading(false);
    }
  }

  /*
   * ------------------------------------------------------------
   * STEP 5
   *
   * Mint the already-approved IPFS ticket.
   * ------------------------------------------------------------
   */
  async function mintTicket() {
    if (!ipfsTicket?.url) {
      setError("Please upload the ticket to IPFS first.");
      return;
    }

    setError("");
    setMint(null);
    setStage("minting");

    try {
      /*
       * We pass the IPFS ticket URL as the image.
       *
       * Your current /api/mint5 route will perform its own:
       * - hasMinted check
       * - remainingSupply check
       * - isHashUsed check
       *
       * before minting.
       */
      const response = await fetch("/api/mint5", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: wallet.trim(),
          name: name.trim(),
          email: email.trim(),
          image: ipfsTicket.url,
          linkedinId: linkedinId.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        /*
         * If somebody minted between our first wallet check
         * and this mint request, the backend will catch it.
         */
        throw new Error(
          result?.error || "Mint transaction failed."
        );
      }

      setMint(result);
      setStage("minted");
    } catch (err: any) {
      console.error("Mint error:", err);

      /*
       * Return to the IPFS stage so the user can still see
       * the approved IPFS ticket.
       */
      setStage("ipfs");

      setError(err?.message || "Mint failed.");
    }
  }

  /*
   * Start over without refreshing the page.
   */
  function resetFlow() {
    setName("Jane Smith");
    setWallet("");
    setEmail("");
    setLinkedinId("test-jane-001");
    setTokenId("001");
    setImageUrl("");

    setStage("details");

    setTicket(null);
    setIpfsTicket(null);
    setMint(null);

    setError("");
    setWalletStatus("");
    setUploading(false);

    setLocalPreviewUrl((previous) => {
      if (previous.startsWith("blob:")) {
        URL.revokeObjectURL(previous);
      }

      return "";
    });
  }

  return (
    <main style={styles.page}>
      <div style={styles.backgroundGlowOne} />
      <div style={styles.backgroundGlowTwo} />

      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.brandRow}>
            <div style={styles.brandMark}>IF</div>

            <div>
              <div style={styles.brandName}>innovate finance</div>
              <div style={styles.brandSub}>
                Women in FinTech
              </div>
            </div>
          </div>

          <div style={styles.networkBadge}>
            <span style={styles.networkDot} />
            Avalanche Fuji
          </div>
        </header>

        {/* Progress */}
        <Progress
          stage={stage}
          onReset={resetFlow}
        />

        {/* Main card */}
        <section style={styles.card}>
          {stage === "details" ||
          stage === "checking-wallet" ? (
            <DetailsStage
              name={name}
              setName={setName}
              wallet={wallet}
              setWallet={setWallet}
              email={email}
              setEmail={setEmail}
              linkedinId={linkedinId}
              setLinkedinId={setLinkedinId}
              tokenId={tokenId}
              setTokenId={setTokenId}
              imageUrl={imageUrl}
              setImageUrl={setImageUrl}
              walletIsValid={walletIsValid}
              loading={stage === "checking-wallet"}
              onSubmit={handleDetailsSubmit}
              error={error}
              walletStatus={walletStatus}
            />
          ) : null}

          {stage === "preview" ? (
            <PreviewStage
              name={name}
              wallet={wallet}
              ticketUrl={localPreviewUrl}
              error={error}
              uploading={uploading}
              onBack={() => {
                setStage("details");
                setError("");
              }}
              onApprove={approveAndUpload}
            />
          ) : null}

          {stage === "ipfs" ? (
            <IpfsStage
              name={name}
              wallet={wallet}
              ipfsUrl={ipfsTicket?.url || ""}
              cid={ipfsTicket?.cid}
              error={error}
              onMint={mintTicket}
              onBack={() => {
                setStage("preview");
                setError("");
              }}
            />
          ) : null}

          {stage === "minting" ? (
            <MintingStage name={name} />
          ) : null}

          {stage === "minted" ? (
            <MintedStage
              name={name}
              wallet={wallet}
              mint={mint}
              ticketUrl={
                ipfsTicket?.url ||
                mint?.image ||
                ""
              }
              onReset={resetFlow}
            />
          ) : null}
        </section>

        {/* Footer */}
        <footer style={styles.footer}>
          <span>Women in FinTech Powerlist 2026</span>
          <span>•</span>
          <span>Official Digital Ticket</span>
        </footer>
      </div>
    </main>
  );
}

/* ============================================================
   DETAILS
   ============================================================ */

function DetailsStage({
  name,
  setName,
  wallet,
  setWallet,
  email,
  setEmail,
  linkedinId,
  setLinkedinId,
  tokenId,
  setTokenId,
  imageUrl,
  setImageUrl,
  walletIsValid,
  loading,
  onSubmit,
  error,
  walletStatus,
}: {
  name: string;
  setName: (value: string) => void;
  wallet: string;
  setWallet: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  linkedinId: string;
  setLinkedinId: (value: string) => void;
  tokenId: string;
  setTokenId: (value: string) => void;
  imageUrl: string;
  setImageUrl: (value: string) => void;
  walletIsValid: boolean;
  loading: boolean;
  onSubmit: () => void;
  error: string;
  walletStatus: string;
}) {
  return (
    <div>
      <div style={styles.eyebrow}>
        STEP 01 / ELIGIBILITY
      </div>

      <h1 style={styles.title}>
        Create your
        <br />
        <span style={styles.gradientText}>
          digital ticket.
        </span>
      </h1>

      <p style={styles.description}>
        Enter the attendee details below. We&apos;ll check the
        wallet on Avalanche Fuji before generating or uploading
        anything.
      </p>

      <div style={styles.form}>
        <Field
          label="Attendee name"
          value={name}
          onChange={setName}
          placeholder="Jane Smith"
        />

        <Field
          label="Wallet address"
          value={wallet}
          onChange={setWallet}
          placeholder="0x..."
          mono
        />

        {wallet.length > 0 ? (
          <div
            style={{
              ...styles.validation,
              color: walletIsValid
                ? "#6ee7b7"
                : "#fca5a5",
              borderColor: walletIsValid
                ? "rgba(52,211,153,0.2)"
                : "rgba(248,113,113,0.2)",
              background: walletIsValid
                ? "rgba(16,185,129,0.06)"
                : "rgba(239,68,68,0.06)",
            }}
          >
            <span>
              {walletIsValid ? "✓" : "!"}
            </span>

            {walletIsValid
              ? "Valid Avalanche wallet address"
              : "Wallet address must be 42 characters"}
          </div>
        ) : null}

        <div style={styles.twoColumns}>
          <Field
            label="Email"
            value={email}
            onChange={setEmail}
            placeholder="jane@example.com"
          />

          <Field
            label="LinkedIn ID"
            value={linkedinId}
            onChange={setLinkedinId}
            placeholder="jane-smith"
          />
        </div>

        <div style={styles.twoColumns}>
          <Field
            label="Token ID"
            value={tokenId}
            onChange={setTokenId}
            placeholder="001"
          />

          <Field
            label="Profile image URL"
            value={imageUrl}
            onChange={setImageUrl}
            placeholder="https://..."
          />
        </div>

        {walletStatus ? (
          <div style={styles.successBox}>
            <div style={styles.successIcon}>✓</div>

            <div>
              <strong style={styles.statusStrong}>
                Wallet check
              </strong>

              <div style={styles.statusText}>
                {walletStatus}
              </div>
            </div>
          </div>
        ) : null}

        {error ? (
          <ErrorBox message={error} />
        ) : null}

        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          style={{
            ...styles.primaryButton,
            opacity: loading ? 0.65 : 1,
            cursor: loading
              ? "wait"
              : "pointer",
          }}
        >
          {loading ? (
            <>
              <Spinner />
              Checking wallet...
            </>
          ) : (
            <>
              Check wallet & continue
              <span style={styles.buttonArrow}>→</span>
            </>
          )}
        </button>
      </div>

      <div style={styles.infoRow}>
        <InfoItem
          number="01"
          text="Wallet eligibility"
        />

        <InfoItem
          number="02"
          text="Ticket preview"
        />

        <InfoItem
          number="03"
          text="IPFS + mint"
        />
      </div>
    </div>
  );
}

/* ============================================================
   LOCAL PREVIEW
   ============================================================ */

function PreviewStage({
  name,
  wallet,
  ticketUrl,
  error,
  uploading,
  onBack,
  onApprove,
}: {
  name: string;
  wallet: string;
  ticketUrl: string;
  error: string;
  uploading: boolean;
  onBack: () => void;
  onApprove: () => void;
}) {
  return (
    <div>
      <div style={styles.eyebrow}>
        STEP 02 / REVIEW
      </div>

      <div style={styles.stageHeadingRow}>
        <div>
          <h1 style={styles.titleSmall}>
            Review your ticket.
          </h1>

          <p style={styles.description}>
            This is the exact ticket that will be uploaded
            to IPFS. Nothing has been uploaded yet.
          </p>
        </div>

        <div style={styles.pendingBadge}>
          NOT ON IPFS
        </div>
      </div>

      <div style={styles.ticketArea}>
        {ticketUrl ? (
          <img
            src={ticketUrl}
            alt={`${name} digital ticket`}
            style={styles.ticketImage}
          />
        ) : (
          <div style={styles.imagePlaceholder}>
            No preview available
          </div>
        )}
      </div>

      <div style={styles.reviewMeta}>
        <MetaRow
          label="Issued to"
          value={name}
        />

        <MetaRow
          label="Wallet"
          value={shortWallet(wallet)}
          mono
        />

        <MetaRow
          label="Storage"
          value="Local preview only"
        />
      </div>

      {error ? (
        <ErrorBox message={error} />
      ) : null}

      <div style={styles.actionRow}>
        <button
          type="button"
          onClick={onBack}
          disabled={uploading}
          style={styles.secondaryButton}
        >
          ← Back
        </button>

        <button
          type="button"
          onClick={onApprove}
          disabled={uploading}
          style={{
            ...styles.primaryButton,
            flex: 1,
            opacity: uploading ? 0.65 : 1,
            cursor: uploading
              ? "wait"
              : "pointer",
          }}
        >
          {uploading ? (
            <>
              <Spinner />
              Uploading to IPFS...
            </>
          ) : (
            <>
              Approve & upload to IPFS
              <span style={styles.buttonArrow}>
                →
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   IPFS + MINT
   ============================================================ */

function IpfsStage({
  name,
  wallet,
  ipfsUrl,
  cid,
  error,
  onMint,
  onBack,
}: {
  name: string;
  wallet: string;
  ipfsUrl: string;
  cid?: string;
  error: string;
  onMint: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <div style={styles.eyebrow}>
        STEP 03 / IPFS + MINT
      </div>

      <div style={styles.stageHeadingRow}>
        <div>
          <h1 style={styles.titleSmall}>
            Ticket is on IPFS.
          </h1>

          <p style={styles.description}>
            Review the uploaded copy below. When you&apos;re
            ready, mint this ticket to the wallet.
          </p>
        </div>

        <div style={styles.liveBadge}>
          ● IPFS LIVE
        </div>
      </div>

      <div style={styles.ticketArea}>
        {ipfsUrl ? (
          <img
            src={ipfsUrl}
            alt={`${name} IPFS ticket`}
            style={styles.ticketImage}
          />
        ) : (
          <div style={styles.imagePlaceholder}>
            IPFS preview unavailable
          </div>
        )}
      </div>

      <div style={styles.reviewMeta}>
        <MetaRow
          label="Issued to"
          value={name}
        />

        <MetaRow
          label="Wallet"
          value={shortWallet(wallet)}
          mono
        />

        <MetaRow
          label="Storage"
          value="IPFS / Pinata"
        />

        {cid ? (
          <MetaRow
            label="CID"
            value={cid}
            mono
          />
        ) : null}
      </div>

      {error ? (
        <ErrorBox message={error} />
      ) : null}

      <div style={styles.warningBox}>
        <div style={styles.warningIcon}>!</div>

        <div>
          <strong style={styles.statusStrong}>
            Final mint
          </strong>

          <div style={styles.statusText}>
            Your wallet will be checked again by the mint
            API before the NFT is created.
          </div>
        </div>
      </div>

      <div style={styles.actionRow}>
        <button
          type="button"
          onClick={onBack}
          style={styles.secondaryButton}
        >
          ← Preview
        </button>

        <button
          type="button"
          onClick={onMint}
          style={{
            ...styles.primaryButton,
            flex: 1,
          }}
        >
          Mint NFT
          <span style={styles.buttonArrow}>→</span>
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   MINTING
   ============================================================ */

function MintingStage({
  name,
}: {
  name: string;
}) {
  return (
    <div style={styles.centerStage}>
      <div style={styles.largeSpinner}>
        <div style={styles.spinnerRing} />
      </div>

      <div style={styles.eyebrow}>
        TRANSACTION IN PROGRESS
      </div>

      <h1 style={styles.titleSmall}>
        Minting {name}&apos;s ticket.
      </h1>

      <p style={styles.description}>
        Your ticket has been uploaded to IPFS. We&apos;re
        now waiting for the Avalanche Fuji transaction to
        confirm.
      </p>

      <div style={styles.processingBox}>
        <span style={styles.processingDot} />
        Waiting for blockchain confirmation
      </div>
    </div>
  );
}

/* ============================================================
   MINTED
   ============================================================ */

function MintedStage({
  name,
  wallet,
  mint,
  ticketUrl,
  onReset,
}: {
  name: string;
  wallet: string;
  mint: MintData | null;
  ticketUrl: string;
  onReset: () => void;
}) {
  return (
    <div>
      <div style={styles.eyebrow}>
        COMPLETE / MINTED
      </div>

      <div style={styles.successHero}>
        <div style={styles.successCircle}>
          ✓
        </div>

        <div>
          <h1 style={styles.titleSmall}>
            NFT minted successfully.
          </h1>

          <p style={styles.description}>
            {name}&apos;s Women in FinTech Powerlist ticket
            is now on-chain.
          </p>
        </div>
      </div>

      <div style={styles.ticketArea}>
        {ticketUrl ? (
          <img
            src={ticketUrl}
            alt={`${name} minted ticket`}
            style={styles.ticketImage}
          />
        ) : null}
      </div>

      <div style={styles.reviewMeta}>
        <MetaRow
          label="Wallet"
          value={shortWallet(wallet)}
          mono
        />

        {mint?.blockNumber ? (
          <MetaRow
            label="Block"
            value={mint.blockNumber}
            mono
          />
        ) : null}

        {mint?.txHash ? (
          <MetaRow
            label="Transaction"
            value={shortHash(mint.txHash)}
            mono
          />
        ) : null}

        {mint?.tokenURI ? (
          <MetaRow
            label="Token URI"
            value={mint.tokenURI}
            mono
          />
        ) : null}
      </div>

      {mint?.txHash ? (
        <a
          href={`https://testnet.snowtrace.io/tx/${mint.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.explorerButton}
        >
          View transaction on Avalanche
          <span>↗</span>
        </a>
      ) : null}

      <button
        type="button"
        onClick={onReset}
        style={styles.secondaryButtonFull}
      >
        Create another ticket
      </button>
    </div>
  );
}

/* ============================================================
   SHARED COMPONENTS
   ============================================================ */

function Progress({
  stage,
  onReset,
}: {
  stage: Stage;
  onReset: () => void;
}) {
  const step =
    stage === "details" ||
    stage === "checking-wallet"
      ? 1
      : stage === "preview"
      ? 2
      : 3;

  return (
    <div style={styles.progressWrapper}>
      <div style={styles.progressLine}>
        <div
          style={{
            ...styles.progressFill,
            width: `${((step - 1) / 2) * 100}%`,
          }}
        />
      </div>

      <div style={styles.progressItems}>
        <ProgressItem
          number="01"
          label="Details"
          active={step >= 1}
          current={step === 1}
        />

        <ProgressItem
          number="02"
          label="Preview"
          active={step >= 2}
          current={step === 2}
        />

        <ProgressItem
          number="03"
          label="IPFS + Mint"
          active={step >= 3}
          current={step === 3}
        />
      </div>

      {stage !== "details" &&
      stage !== "checking-wallet" ? (
        <button
          type="button"
          onClick={onReset}
          style={styles.resetButton}
        >
          Start over
        </button>
      ) : null}
    </div>
  );
}

function ProgressItem({
  number,
  label,
  active,
  current,
}: {
  number: string;
  label: string;
  active: boolean;
  current: boolean;
}) {
  return (
    <div style={styles.progressItem}>
      <div
        style={{
          ...styles.progressNumber,
          opacity: active ? 1 : 0.35,
          borderColor: current
            ? "#5b9aff"
            : active
            ? "rgba(91,154,255,0.4)"
            : "rgba(255,255,255,0.12)",
          background: current
            ? "rgba(91,154,255,0.12)"
            : "rgba(255,255,255,0.03)",
        }}
      >
        {number}
      </div>

      <span
        style={{
          ...styles.progressLabel,
          opacity: active ? 1 : 0.4,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  mono = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <label style={styles.field}>
      <span style={styles.fieldLabel}>
        {label}
      </span>

      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        spellCheck={false}
        style={{
          ...styles.input,
          ...(mono ? styles.inputMono : {}),
        }}
      />
    </label>
  );
}

function ErrorBox({
  message,
}: {
  message: string;
}) {
  return (
    <div style={styles.errorBox}>
      <div style={styles.errorIcon}>!</div>

      <div>
        <strong style={styles.errorTitle}>
          Something went wrong
        </strong>

        <div style={styles.errorText}>
          {message}
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  number,
  text,
}: {
  number: string;
  text: string;
}) {
  return (
    <div style={styles.infoItem}>
      <span style={styles.infoNumber}>
        {number}
      </span>

      <span>{text}</span>
    </div>
  );
}

function MetaRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div style={styles.metaRow}>
      <span style={styles.metaLabel}>
        {label}
      </span>

      <span
        style={{
          ...styles.metaValue,
          ...(mono ? styles.metaMono : {}),
        }}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}

function Spinner() {
  return <span style={styles.spinner} />;
}

/* ============================================================
   HELPERS
   ============================================================ */

function shortWallet(wallet: string) {
  if (!wallet) return "—";

  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

function shortHash(hash: string) {
  if (!hash) return "—";

  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

function safeFilename(name: string) {
  return (
    name
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "ticket"
  );
}

/* ============================================================
   INLINE STYLES
   ============================================================ */

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at 15% 10%, rgba(30,99,241,0.12), transparent 30%), radial-gradient(circle at 85% 80%, rgba(91,154,255,0.08), transparent 28%), #070c14",
    color: "#f5f7fa",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    padding: "40px 20px 60px",
    position: "relative",
    overflow: "hidden",
  },

  backgroundGlowOne: {
    position: "fixed",
    width: 400,
    height: 400,
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(30,99,241,0.08), transparent 70%)",
    top: -150,
    left: -150,
    pointerEvents: "none",
  },

  backgroundGlowTwo: {
    position: "fixed",
    width: 500,
    height: 500,
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(91,154,255,0.05), transparent 70%)",
    bottom: -250,
    right: -200,
    pointerEvents: "none",
  },

  container: {
    width: "100%",
    maxWidth: 820,
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
    marginBottom: 48,
  },

  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: 13,
  },

  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg, #1e63f1, #5b9aff)",
    color: "#fff",
    fontWeight: 900,
    fontSize: 14,
    letterSpacing: "-0.04em",
    boxShadow:
      "0 8px 30px rgba(30,99,241,0.25)",
  },

  brandName: {
    fontSize: 14,
    fontWeight: 800,
    letterSpacing: "-0.02em",
  },

  brandSub: {
    color: "#6f8298",
    fontSize: 11,
    marginTop: 2,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },

  networkBadge: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.035)",
    borderRadius: 999,
    padding: "8px 12px",
    color: "#91a4b9",
    fontSize: 11,
    fontWeight: 700,
  },

  networkDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#5b9aff",
    boxShadow:
      "0 0 12px rgba(91,154,255,0.9)",
  },

  progressWrapper: {
    position: "relative",
    marginBottom: 20,
    padding: "0 4px",
  },

  progressLine: {
    position: "absolute",
    top: 16,
    left: 55,
    right: 55,
    height: 1,
    background: "rgba(255,255,255,0.08)",
  },

  progressFill: {
    height: "100%",
    background:
      "linear-gradient(90deg, #1e63f1, #5b9aff)",
    transition: "width 0.35s ease",
  },

  progressItems: {
    position: "relative",
    display: "flex",
    justifyContent: "space-between",
  },

  progressItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    minWidth: 90,
  },

  progressNumber: {
    width: 33,
    height: 33,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid",
    fontSize: 10,
    fontWeight: 800,
    color: "#c8d5e3",
    transition: "all 0.25s ease",
  },

  progressLabel: {
    fontSize: 10,
    color: "#8ea0b4",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },

  resetButton: {
    position: "absolute",
    right: 0,
    top: 50,
    background: "transparent",
    border: "none",
    color: "#63758a",
    fontSize: 11,
    cursor: "pointer",
  },

  card: {
    background:
      "linear-gradient(145deg, rgba(20,31,47,0.97), rgba(10,17,27,0.98))",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 24,
    padding: "42px",
    boxShadow:
      "0 30px 100px rgba(0,0,0,0.35)",
    backdropFilter: "blur(20px)",
  },

  eyebrow: {
    color: "#5b9aff",
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: "0.16em",
    marginBottom: 16,
  },

  title: {
    margin: 0,
    fontSize: "clamp(38px, 7vw, 62px)",
    lineHeight: 0.98,
    letterSpacing: "-0.055em",
    fontWeight: 850,
  },

  titleSmall: {
    margin: 0,
    fontSize: "clamp(30px, 5vw, 44px)",
    lineHeight: 1,
    letterSpacing: "-0.045em",
    fontWeight: 850,
  },

  gradientText: {
    background:
      "linear-gradient(100deg, #ffffff 0%, #5b9aff 75%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  description: {
    color: "#8192a7",
    fontSize: 14,
    lineHeight: 1.7,
    maxWidth: 600,
    margin: "17px 0 30px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: 17,
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  fieldLabel: {
    color: "#9eafc2",
    fontSize: 10,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    height: 52,
    borderRadius: 11,
    border: "1px solid rgba(255,255,255,0.1)",
    outline: "none",
    background: "rgba(0,0,0,0.18)",
    color: "#f4f7fb",
    padding: "0 15px",
    fontSize: 14,
    transition:
      "border-color 0.2s ease, background 0.2s ease",
  },

  inputMono: {
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: 12,
  },

  twoColumns: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 17,
  },

  validation: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    border: "1px solid",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 11,
    fontWeight: 650,
  },

  successBox: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    border:
      "1px solid rgba(52,211,153,0.18)",
    background: "rgba(16,185,129,0.05)",
    borderRadius: 12,
    padding: 14,
  },

  successIcon: {
    width: 23,
    height: 23,
    flexShrink: 0,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(52,211,153,0.12)",
    color: "#6ee7b7",
    fontSize: 12,
    fontWeight: 900,
  },

  statusStrong: {
    color: "#dbe7f5",
    fontSize: 12,
    display: "block",
    marginBottom: 3,
  },

  statusText: {
    color: "#7d91a7",
    fontSize: 11,
    lineHeight: 1.5,
  },

  errorBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    border:
      "1px solid rgba(248,113,113,0.2)",
    background: "rgba(239,68,68,0.06)",
    marginTop: 4,
  },

  errorIcon: {
    width: 23,
    height: 23,
    flexShrink: 0,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(239,68,68,0.12)",
    color: "#fca5a5",
    fontWeight: 900,
    fontSize: 12,
  },

  errorTitle: {
    color: "#fecaca",
    fontSize: 12,
    display: "block",
    marginBottom: 3,
  },

  errorText: {
    color: "#d28b8b",
    fontSize: 11,
    lineHeight: 1.5,
  },

  primaryButton: {
    minHeight: 54,
    border: "none",
    borderRadius: 11,
    background:
      "linear-gradient(135deg, #1e63f1, #4b8df7)",
    color: "#fff",
    padding: "0 20px",
    fontSize: 12,
    fontWeight: 850,
    letterSpacing: "0.01em",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    boxShadow:
      "0 12px 30px rgba(30,99,241,0.2)",
    transition:
      "transform 0.2s ease, opacity 0.2s ease",
  },

  buttonArrow: {
    fontSize: 18,
    lineHeight: 1,
  },

  secondaryButton: {
    minHeight: 54,
    border:
      "1px solid rgba(255,255,255,0.1)",
    borderRadius: 11,
    background: "rgba(255,255,255,0.035)",
    color: "#9eafc2",
    padding: "0 20px",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  },

  secondaryButtonFull: {
    width: "100%",
    minHeight: 52,
    border:
      "1px solid rgba(255,255,255,0.1)",
    borderRadius: 11,
    background: "rgba(255,255,255,0.035)",
    color: "#9eafc2",
    padding: "0 20px",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
    marginTop: 12,
  },

  actionRow: {
    display: "flex",
    gap: 12,
    marginTop: 20,
  },

  infoRow: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 10,
    marginTop: 30,
    paddingTop: 22,
    borderTop:
      "1px solid rgba(255,255,255,0.06)",
  },

  infoItem: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    color: "#64768a",
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },

  infoNumber: {
    color: "#5b9aff",
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, monospace",
  },

  stageHeadingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
    marginBottom: 25,
  },

  pendingBadge: {
    flexShrink: 0,
    border:
      "1px solid rgba(251,191,36,0.18)",
    background: "rgba(251,191,36,0.06)",
    color: "#fcd34d",
    padding: "7px 9px",
    borderRadius: 7,
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: "0.08em",
  },

  liveBadge: {
    flexShrink: 0,
    border:
      "1px solid rgba(52,211,153,0.18)",
    background: "rgba(52,211,153,0.06)",
    color: "#6ee7b7",
    padding: "7px 9px",
    borderRadius: 7,
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: "0.08em",
  },

  ticketArea: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "30px 20px",
    borderRadius: 16,
    background:
      "radial-gradient(circle, rgba(255,255,255,0.04), rgba(0,0,0,0.18))",
    border:
      "1px solid rgba(255,255,255,0.07)",
    minHeight: 300,
  },

  ticketImage: {
    display: "block",
    width: "100%",
    maxWidth: 420,
    height: "auto",
    borderRadius: 10,
    boxShadow:
      "0 25px 70px rgba(0,0,0,0.4)",
  },

  imagePlaceholder: {
    color: "#63758a",
    fontSize: 12,
  },

  reviewMeta: {
    marginTop: 16,
    border:
      "1px solid rgba(255,255,255,0.07)",
    borderRadius: 12,
    overflow: "hidden",
  },

  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
    padding: "12px 14px",
    borderBottom:
      "1px solid rgba(255,255,255,0.05)",
  },

  metaLabel: {
    color: "#65778b",
    fontSize: 10,
    fontWeight: 750,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },

  metaValue: {
    color: "#cbd7e5",
    fontSize: 11,
    textAlign: "right",
    maxWidth: "65%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  metaMono: {
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },

  warningBox: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    marginTop: 14,
    padding: 14,
    borderRadius: 12,
    border:
      "1px solid rgba(91,154,255,0.15)",
    background: "rgba(91,154,255,0.04)",
  },

  warningIcon: {
    width: 23,
    height: 23,
    flexShrink: 0,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(91,154,255,0.1)",
    color: "#8bb5ff",
    fontWeight: 900,
    fontSize: 12,
  },

  spinner: {
    display: "inline-block",
    width: 14,
    height: 14,
    borderRadius: "50%",
    border:
      "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    animation: "spin 0.7s linear infinite",
  },

  centerStage: {
    textAlign: "center",
    padding: "55px 10px",
  },

  largeSpinner: {
    width: 76,
    height: 76,
    margin: "0 auto 25px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background:
      "rgba(91,154,255,0.07)",
  },

  spinnerRing: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    border:
      "3px solid rgba(91,154,255,0.15)",
    borderTopColor: "#5b9aff",
    animation: "spin 0.8s linear infinite",
  },

  processingBox: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.035)",
    border:
      "1px solid rgba(255,255,255,0.08)",
    color: "#7f92a7",
    fontSize: 11,
  },

  processingDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#5b9aff",
    boxShadow:
      "0 0 10px rgba(91,154,255,0.8)",
  },

  successHero: {
    display: "flex",
    alignItems: "center",
    gap: 17,
    marginBottom: 28,
  },

  successCircle: {
    width: 58,
    height: 58,
    flexShrink: 0,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(52,211,153,0.1)",
    border:
      "1px solid rgba(52,211,153,0.25)",
    color: "#6ee7b7",
    fontSize: 25,
    fontWeight: 900,
    boxShadow:
      "0 0 30px rgba(52,211,153,0.08)",
  },

  explorerButton: {
    marginTop: 14,
    width: "100%",
    minHeight: 50,
    boxSizing: "border-box",
    border:
      "1px solid rgba(91,154,255,0.18)",
    borderRadius: 11,
    background: "rgba(91,154,255,0.05)",
    color: "#8bb5ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    textDecoration: "none",
    fontSize: 11,
    fontWeight: 800,
  },

  footer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
    color: "#455568",
    fontSize: 10,
    marginTop: 25,
    letterSpacing: "0.04em",
  },
};

/*
 * Add the spinner animation without requiring a CSS file.
 *
 * This is injected once on the client.
 */
if (
  typeof document !== "undefined" &&
  !document.getElementById("ticket-page-animation")
) {
  const style = document.createElement("style");

  style.id = "ticket-page-animation";

  style.innerHTML = `
    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    input:focus {
      border-color: rgba(91,154,255,0.55) !important;
      background: rgba(91,154,255,0.035) !important;
      box-shadow: 0 0 0 3px rgba(91,154,255,0.06);
    }

    button:not(:disabled):hover {
      transform: translateY(-1px);
    }

    button:not(:disabled):active {
      transform: translateY(0);
    }
  `;

  document.head.appendChild(style);
}