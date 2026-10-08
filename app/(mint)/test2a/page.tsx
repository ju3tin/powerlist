"use client";

import {
  FormEvent,
  useState,
} from "react";

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

  /*
   * STEP 1:
   * Generate and upload the ticket only.
   *
   * This does NOT mint the NFT.
   */
  async function handleGenerateTicket(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setTicket(null);
    setMint(null);

    try {
      // ==========================================
      // 1. VALIDATE WALLET
      // ==========================================

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

      // ==========================================
      // 2. GENERATE + UPLOAD TICKET
      // ==========================================

      setStep(
        "Generating ticket and uploading to Pinata..."
      );

      const ticketParams =
        new URLSearchParams();

      ticketParams.set(
        "name",
        name.trim()
      );

      ticketParams.set(
        "tokenId",
        tokenId.trim()
      );

      if (imageUrl.trim()) {
        ticketParams.set(
          "imageUrl",
          imageUrl.trim()
        );
      }

      const ticketResponse =
        await fetch(
          `/api/ticket-test?${ticketParams.toString()}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

      const ticketData =
        await ticketResponse.json();

      if (!ticketResponse.ok) {
        throw new Error(
          ticketData.error ||
            "Ticket upload failed."
        );
      }

      if (!ticketData.cid) {
        throw new Error(
          "Pinata did not return a CID."
        );
      }

      if (!ticketData.url) {
        throw new Error(
          "Pinata did not return an image URL."
        );
      }

      const uploadedTicket = {
        cid: ticketData.cid,
        url: ticketData.url,
      };

      setTicket(uploadedTicket);

      /*
       * IMPORTANT:
       * Stop here.
       *
       * The NFT has NOT been minted yet.
       */
      setStep(
        "Ticket generated. Please review it below before minting."
      );
    } catch (error) {
      console.error(
        "TEST TICKET ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * STEP 2:
   * Mint the already-generated ticket.
   */
  async function handleMint() {
    if (!ticket) {
      setError(
        "Please generate the ticket first."
      );
      return;
    }

    setLoading(true);
    setError("");
    setMint(null);

    try {
      setStep(
        "Ticket approved. Minting NFT on Avalanche Fuji..."
      );

      const mintResponse =
        await fetch("/api/mint5", {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            wallet,
            name,
            email,
            image: ticket.url,
            linkedinId,
          }),
        });

      const mintData =
        await mintResponse.json();

      if (!mintResponse.ok) {
        throw new Error(
          mintData.error ||
            "Mint failed."
        );
      }

      setMint(mintData);

      setStep(
        "NFT successfully minted!"
      );
    } catch (error) {
      console.error(
        "TEST MINT ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * Allow the user to go back and regenerate
   * the ticket before minting.
   */
  function handleRegenerate() {
    setTicket(null);
    setMint(null);
    setError("");
    setStep("");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f6f8",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          background: "#ffffff",
          padding: "32px",
          borderRadius: "16px",
          boxShadow:
            "0 10px 40px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            marginTop: 0,
          }}
        >
          Women in FinTech
          <br />
          Mint Test
        </h1>

        <p
          style={{
            color: "#666",
          }}
        >
          Generate the ticket first, review the
          final image, then choose whether to mint
          the NFT on Avalanche Fuji.
        </p>

        <form
          onSubmit={
            handleGenerateTicket
          }
        >
          {/* NAME */}

          <div
            style={{
              marginTop: "25px",
            }}
          >
            <label
              htmlFor="name"
              style={{
                display: "block",
                fontWeight: 600,
                marginBottom: "8px",
              }}
            >
              Name
            </label>

            <input
              id="name"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
              required
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* WALLET */}

          <div
            style={{
              marginTop: "20px",
            }}
          >
            <label
              htmlFor="wallet"
              style={{
                display: "block",
                fontWeight: 600,
                marginBottom: "8px",
              }}
            >
              Wallet Address
            </label>

            <input
              id="wallet"
              value={wallet}
              onChange={(event) =>
                setWallet(
                  event.target.value
                )
              }
              placeholder="0x..."
              required
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                boxSizing: "border-box",
                fontFamily: "monospace",
              }}
            />
          </div>

          {/* EMAIL */}

          <div
            style={{
              marginTop: "20px",
            }}
          >
            <label
              htmlFor="email"
              style={{
                display: "block",
                fontWeight: 600,
                marginBottom: "8px",
              }}
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* LINKEDIN ID */}

          <div
            style={{
              marginTop: "20px",
            }}
          >
            <label
              htmlFor="linkedinId"
              style={{
                display: "block",
                fontWeight: 600,
                marginBottom: "8px",
              }}
            >
              LinkedIn ID
            </label>

            <input
              id="linkedinId"
              value={linkedinId}
              onChange={(event) =>
                setLinkedinId(
                  event.target.value
                )
              }
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* TOKEN ID */}

          <div
            style={{
              marginTop: "20px",
            }}
          >
            <label
              htmlFor="tokenId"
              style={{
                display: "block",
                fontWeight: 600,
                marginBottom: "8px",
              }}
            >
              Ticket Token ID
            </label>

            <input
              id="tokenId"
              value={tokenId}
              onChange={(event) =>
                setTokenId(
                  event.target.value
                )
              }
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* PROFILE IMAGE */}

          <div
            style={{
              marginTop: "20px",
            }}
          >
            <label
              htmlFor="imageUrl"
              style={{
                display: "block",
                fontWeight: 600,
                marginBottom: "8px",
              }}
            >
              Profile Image URL
              <span
                style={{
                  color: "#888",
                  fontWeight: 400,
                  marginLeft: "6px",
                }}
              >
                optional
              </span>
            </label>

            <input
              id="imageUrl"
              type="url"
              value={imageUrl}
              onChange={(event) =>
                setImageUrl(
                  event.target.value
                )
              }
              placeholder="https://..."
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* GENERATE BUTTON */}

          {!ticket && (
            <button
              type="submit"
              disabled={
                loading ||
                !name.trim() ||
                !wallet.trim()
              }
              style={{
                width: "100%",
                marginTop: "25px",
                padding: "15px",
                border: "none",
                borderRadius: "8px",
                background:
                  loading
                    ? "#999"
                    : "#111",
                color: "white",
                fontSize: "16px",
                fontWeight: 600,
                cursor: loading
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {loading
                ? step ||
                  "Generating..."
                : "Generate Ticket"}
            </button>
          )}
        </form>

        {/* STATUS */}

        {loading && (
          <div
            style={{
              marginTop: "20px",
              padding: "15px",
              background: "#eef5ff",
              border:
                "1px solid #c8ddff",
              borderRadius: "8px",
              color: "#1755a5",
            }}
          >
            {step}
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div
            style={{
              marginTop: "25px",
              padding: "15px",
              background: "#fff0f0",
              border:
                "1px solid #ffcccc",
              borderRadius: "8px",
              color: "#b00020",
            }}
          >
            <strong>
              Error
            </strong>

            <p
              style={{
                marginBottom: 0,
                wordBreak: "break-word",
              }}
            >
              {error}
            </p>
          </div>
        )}

        {/* TICKET PREVIEW */}

        {ticket && !mint && (
          <div
            style={{
              marginTop: "35px",
              paddingTop: "30px",
              borderTop:
                "1px solid #eee",
            }}
          >
            <h2
              style={{
                marginTop: 0,
              }}
            >
              Ticket Preview
            </h2>

            <p
              style={{
                color: "#555",
              }}
            >
              Review this ticket carefully.
              <strong>
                {" "}
                Nothing has been minted yet.
              </strong>
            </p>

            <div
              style={{
                padding: "15px",
                background: "#fff8e6",
                border:
                  "1px solid #f0d58a",
                borderRadius: "8px",
                color: "#765800",
                marginBottom: "20px",
              }}
            >
              <strong>
                Preview only
              </strong>
              <br />
              The NFT will not be minted until
              you click "Mint NFT".
            </div>

            <p>
              <strong>
                CID:
              </strong>
            </p>

            <div
              style={{
                padding: "12px",
                background: "#f5f5f5",
                borderRadius: "8px",
                fontFamily:
                  "monospace",
                fontSize: "13px",
                wordBreak: "break-all",
              }}
            >
              {ticket.cid}
            </div>

            <p
              style={{
                marginTop: "20px",
              }}
            >
              <strong>
                Public IPFS URL:
              </strong>
            </p>

            <a
              href={ticket.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#0066cc",
                wordBreak: "break-all",
              }}
            >
              {ticket.url}
            </a>

            {/* ACTUAL TICKET IMAGE */}

            <img
              src={ticket.url}
              alt={`Ticket for ${name}`}
              style={{
                display: "block",
                width: "100%",
                maxWidth: "600px",
                height: "auto",
                margin:
                  "25px auto 0",
                borderRadius: "10px",
                border:
                  "1px solid #ddd",
              }}
            />

            {/* APPROVAL ACTIONS */}

            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "25px",
              }}
            >
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "15px",
                  border:
                    "1px solid #ccc",
                  borderRadius: "8px",
                  background: "white",
                  color: "#333",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: loading
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                Regenerate
              </button>

              <button
                type="button"
                onClick={handleMint}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "15px",
                  border: "none",
                  borderRadius: "8px",
                  background:
                    loading
                      ? "#999"
                      : "#16803c",
                  color: "white",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: loading
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                {loading
                  ? "Minting..."
                  : "Mint NFT"}
              </button>
            </div>
          </div>
        )}

        {/* MINT RESULT */}

        {mint && (
          <div
            style={{
              marginTop: "35px",
              padding: "25px",
              background: "#effcf4",
              border:
                "1px solid #b7e8c9",
              borderRadius: "12px",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                color: "#16803c",
              }}
            >
              NFT Minted 🎉
            </h2>

            <p>
              <strong>
                Transaction:
              </strong>
            </p>

            <div
              style={{
                fontFamily:
                  "monospace",
                wordBreak: "break-all",
              }}
            >
              {mint.txHash}
            </div>

            <p>
              <strong>
                Block:
              </strong>{" "}
              {mint.blockNumber}
            </p>

            <p>
              <strong>
                Token image:
              </strong>
            </p>

            <a
              href={mint.image}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#0066cc",
                wordBreak: "break-all",
              }}
            >
              {mint.image}
            </a>

            <p
              style={{
                marginTop: "20px",
                color: "#16803c",
                fontWeight: 600,
              }}
            >
              The NFT is now minted to:
            </p>

            <div
              style={{
                fontFamily:
                  "monospace",
                wordBreak: "break-all",
              }}
            >
              {wallet}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}