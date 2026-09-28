"use client";

import { FormEvent, useState } from "react";

type TicketResult = {
  success: boolean;
  cid: string;
  url: string;
};

export default function Test1Page() {
  const [name, setName] = useState("");
  const [tokenId, setTokenId] = useState("001");
  const [imageUrl, setImageUrl] = useState("");

  const [result, setResult] =
    useState<TicketResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const params = new URLSearchParams();

      params.set("name", name.trim());
      params.set("tokenId", tokenId.trim());

      if (imageUrl.trim()) {
        params.set("imageUrl", imageUrl.trim());
      }

      console.log(
        "Request:",
        `/api/testticket?${params.toString()}`
      );

      const response = await fetch(
        `/api/testticket?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      console.log("API response:", data);

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Request failed with status ${response.status}`
        );
      }

      if (!data.cid) {
        throw new Error("No CID returned from Pinata");
      }

      setResult({
        success: true,
        cid: data.cid,
        url: data.url,
      });
    } catch (error) {
      console.error("Ticket error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to generate ticket"
      );
    } finally {
      setLoading(false);
    }
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
          background: "#fff",
          padding: "32px",
          borderRadius: "16px",
          boxShadow:
            "0 10px 40px rgba(0, 0, 0, 0.08)",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "32px",
          }}
        >
          Ticket Test
        </h1>

        <p
          style={{
            color: "#666",
            marginBottom: "30px",
          }}
        >
          Generate a ticket, upload it to Pinata,
          and display the IPFS image.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div style={{ marginBottom: "20px" }}>
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
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Jane Smith"
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

          {/* Token ID */}
          <div style={{ marginBottom: "20px" }}>
            <label
              htmlFor="tokenId"
              style={{
                display: "block",
                fontWeight: 600,
                marginBottom: "8px",
              }}
            >
              Token ID
            </label>

            <input
              id="tokenId"
              type="text"
              value={tokenId}
              onChange={(event) =>
                setTokenId(event.target.value)
              }
              placeholder="001"
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

          {/* Image URL */}
          <div style={{ marginBottom: "25px" }}>
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
                  color: "#777",
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
                setImageUrl(event.target.value)
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

          {/* Button */}
          <button
            type="submit"
            disabled={loading || !name.trim()}
            style={{
              width: "100%",
              padding: "14px",
              background:
                loading || !name.trim()
                  ? "#999"
                  : "#111",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: 600,
              cursor:
                loading || !name.trim()
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {loading
              ? "Generating & Uploading..."
              : "Generate Ticket"}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div
            style={{
              marginTop: "25px",
              padding: "16px",
              borderRadius: "8px",
              background: "#fff0f0",
              border: "1px solid #ffcccc",
              color: "#b00020",
            }}
          >
            <strong>Error</strong>

            <div style={{ marginTop: "8px" }}>
              {error}
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div
            style={{
              marginTop: "35px",
              paddingTop: "30px",
              borderTop: "1px solid #eee",
            }}
          >
            <h2
              style={{
                color: "#16803c",
                marginTop: 0,
              }}
            >
              Ticket Uploaded 🎉
            </h2>

            <p>
              <strong>IPFS CID</strong>
            </p>

            <div
              style={{
                padding: "12px",
                background: "#f5f5f5",
                borderRadius: "8px",
                fontFamily: "monospace",
                wordBreak: "break-all",
                fontSize: "13px",
              }}
            >
              {result.cid}
            </div>

            <p
              style={{
                marginTop: "20px",
              }}
            >
              <strong>IPFS URL</strong>
            </p>

            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#0066cc",
                wordBreak: "break-all",
              }}
            >
              {result.url}
            </a>

            <h3
              style={{
                marginTop: "30px",
              }}
            >
              Ticket
            </h3>

            <img
              src={result.url}
              alt={`Women in FinTech Powerlist ticket for ${name}`}
              style={{
                display: "block",
                width: "100%",
                maxWidth: "600px",
                height: "auto",
                borderRadius: "10px",
                border: "1px solid #ddd",
                marginTop: "15px",
              }}
            />
          </div>
        )}
      </div>
    </main>
  );
}