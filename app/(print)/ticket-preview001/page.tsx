
"use client";

import { useEffect, useState } from "react";

export default function TicketPreviewPage() {
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let objectUrl: string | undefined;
    const controller = new AbortController();

    async function generatePreview() {
      try {
        const params = new URLSearchParams(window.location.search);

        const payload = {
          name: params.get("name") || "Guest",
          tokenId: params.get("tokenId") || "001",
          imageUrl: params.get("imageUrl") || "",
          role: params.get("role") || "",
          category: params.get("category") || "",
          year: params.get("year") || "2026",
          companyLogo: params.get("companyLogo") || "",
          linkedinUrl: params.get("linkedinUrl") || "",
        };

        const response = await fetch(
          "https://powerlist-nine.vercel.app/api/preview-ticket3",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          const result = await response.json().catch(() => null);
          throw new Error(
            result?.error || "Unable to generate ticket preview"
          );
        }

        const blob = await response.blob();

        if (!blob.type.startsWith("image/")) {
          throw new Error("The API did not return a ticket image");
        }

        objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong generating the preview"
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    generatePreview();

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 24,
        background: "#f4f5f8",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ color: "#20264f", margin: 0 }}>
        Your Powerlist Ticket
      </h1>

      {loading && <p>Generating your ticket preview…</p>}

      {error && (
        <p style={{ color: "#c62828" }} role="alert">
          {error}
        </p>
      )}

      {imageUrl && (
        <>
          <img
            src={imageUrl}
            alt="Powerlist ticket preview"
            style={{
              display: "block",
              width: "100%",
              maxWidth: 700,
              height: "auto",
              borderRadius: 12,
              boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
            }}
          />

          <a
            href={imageUrl}
            download="powerlist-ticket.png"
            style={{
              display: "inline-block",
              background: "#245cf5",
              color: "#fff",
              padding: "12px 24px",
              borderRadius: 8,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Download Ticket
          </a>
        </>
      )}
    </main>
  );
}
