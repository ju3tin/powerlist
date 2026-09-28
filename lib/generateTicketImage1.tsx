import { ImageResponse } from "@vercel/og";

export async function generateTicketImage1(params: {
  name: string;
  tokenId?: string;
}) {
  const { name, tokenId = "#" } = params;

  const response = new ImageResponse(
    (
      <div
        style={{
          width: "600px",
          height: "840px",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(160deg, #0f1c2e 0%, #1a2f4a 50%, #0d1a2a 100%)",
          color: "white",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            height: "8px",
            width: "100%",
            background: "linear-gradient(90deg, #1e63f1, #4f8cff)",
          }}
        />

        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "28px 36px 0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "#1e63f1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                fontWeight: 700,
              }}
            >
              IF
            </div>
            <span style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.02em" }}>
              innovate finance
            </span>
          </div>
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "999px",
              padding: "6px 14px",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#a8c0d8",
            }}
          >
            Digital Ticket
          </div>
        </div>

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "48px 36px 0",
            flex: 1,
          }}
        >
          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#7eb0ff",
              marginBottom: "16px",
            }}
          >
            Women in FinTech
          </div>

          <div
            style={{
              fontSize: "56px",
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
              marginBottom: "12px",
            }}
          >
            Powerlist
          </div>
          <div
            style={{
              fontSize: "56px",
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
              color: "#4f8cff",
              marginBottom: "48px",
            }}
          >
            2026
          </div>

          {/* Decorative circles */}
          <div
            style={{
              position: "absolute",
              right: "-40px",
              top: "180px",
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              border: "1px solid rgba(78,140,255,0.25)",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: "-80px",
              top: "240px",
              width: "280px",
              height: "280px",
              borderRadius: "50%",
              border: "1px solid rgba(78,140,255,0.15)",
            }}
          />

          {/* Issued to */}
          <div style={{ marginTop: "auto", marginBottom: "32px" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#7a91a8",
                marginBottom: "8px",
              }}
            >
              Issued to
            </div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                maxWidth: "420px",
              }}
            >
              {name}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(255,255,255,0.12)",
            padding: "20px 36px",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#7a91a8",
          }}
        >
          <span>Avalanche Network</span>
          <span>1 of 1 · {tokenId}</span>
        </div>
      </div>
    ),
    {
      width: 600,
      height: 840,
    }
  );

  // Convert to buffer for Pinata upload
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}