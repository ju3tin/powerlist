"use client";

import { useMemo } from "react";

type Props = {
  title: string;
  id: string;
  featuredImage: string;
};

export default function TicketViewer({
  title,
  id,
  featuredImage,
}: Props) {
  const ticketUrl = useMemo(() => {
    const params = new URLSearchParams();

    params.set("name", title);
    params.set("tokenId", id);

    if (featuredImage) {
      params.set("imageUrl", featuredImage);
    }

    return `/api/test-ticket?${params.toString()}`;
  }, [title, id, featuredImage]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        padding: "40px",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 700,
            marginBottom: "10px",
          }}
        >
          Ticket Viewer
        </h1>

        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            marginBottom: "30px",
          }}
        >
          <strong>Query data</strong>

          <pre
            style={{
              marginTop: "10px",
              fontSize: "13px",
              overflowX: "auto",
            }}
          >
{JSON.stringify(
  {
    title,
    id,
    featured_image: featuredImage,
  },
  null,
  2
)}
          </pre>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            background: "#dfe4ea",
            padding: "30px",
            borderRadius: "16px",
          }}
        >
          <img
            src={ticketUrl}
            alt={`Ticket for ${title}`}
            style={{
              width: "600px",
              maxWidth: "100%",
              height: "auto",
              boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
            }}
          />
        </div>
      </div>
    </main>
  );
}