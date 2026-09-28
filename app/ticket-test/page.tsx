"use client";

import {
  FormEvent,
  useState,
} from "react";

type TicketResponse = {
  success: boolean;
  cid: string;
  url: string;
};

export default function TicketTestPage() {
  const [name, setName] =
    useState("Jane Smith");

  const [tokenId, setTokenId] =
    useState("001");

  const [imageUrl, setImageUrl] =
    useState("");

  const [result, setResult] =
    useState<TicketResponse | null>(
      null
    );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setResult(null);

    try {
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

      const url =
        `/api/ticket-test?${params.toString()}`;

      console.log(
        "Calling:",
        url
      );

      const response =
        await fetch(url, {
          method: "GET",
          cache: "no-store",
        });

      const data =
        await response.json();

      console.log(
        "Response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Request failed: ${response.status}`
        );
      }

      if (!data.cid) {
        throw new Error(
          "No CID returned from API."
        );
      }

      if (!data.url) {
        throw new Error(
          "No image URL returned from API."
        );
      }

      setResult(data);
    } catch (error) {
      console.error(
        "Ticket test error:",
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
          background: "white",
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
          Ticket Test
        </h1>

        <p
          style={{
            color: "#666",
          }}
        >
          Generate the ticket, upload it
          to Pinata, then display it
          from IPFS.
        </p>

        <form
          onSubmit={handleSubmit}
        >
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
                border:
                  "1px solid #ccc",
                borderRadius: "8px",
                boxSizing:
                  "border-box",
              }}
            />
          </div>

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
              Token ID
            </label>

            <input
              id="tokenId"
              value={tokenId}
              onChange={(event) =>
                setTokenId(
                  event.target.value
                )
              }
              required
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                border:
                  "1px solid #ccc",
                borderRadius: "8px",
                boxSizing:
                  "border-box",
              }}
            />
          </div>

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
              Profile image URL
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
                border:
                  "1px solid #ccc",
                borderRadius: "8px",
                boxSizing:
                  "border-box",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={
              loading ||
              !name.trim()
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
              cursor:
                loading
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {loading
              ? "Generating..."
              : "Generate & Upload Ticket"}
          </button>
        </form>

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
                wordBreak:
                  "break-word",
              }}
            >
              {error}
            </p>
          </div>
        )}

        {result && (
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
                color: "#16803c",
              }}
            >
              Ticket Uploaded 🎉
            </h2>

            <p>
              <strong>
                CID
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
                wordBreak:
                  "break-all",
              }}
            >
              {result.cid}
            </div>

            <p
              style={{
                marginTop: "20px",
              }}
            >
              <strong>
                IPFS URL
              </strong>
            </p>

            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#0066cc",
                wordBreak:
                  "break-all",
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
              alt={`Ticket for ${name}`}
              style={{
                display: "block",
                width: "100%",
                maxWidth: "600px",
                height: "auto",
                margin: "0 auto",
                borderRadius: "10px",
                border:
                  "1px solid #ddd",
              }}
            />

            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                marginTop: "20px",
                textAlign: "center",
                color: "#0066cc",
              }}
            >
              Open image directly
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
