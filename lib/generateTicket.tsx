import { ImageResponse } from "@vercel/og";

type TicketParams = {
  name: string;
  tokenId?: string;
  imageUrl?: string; // LinkedIn profile photo or any image URL
};

export async function generateTicketImage({
  name,
  tokenId = "001",
  imageUrl,
}: TicketParams): Promise<Buffer> {
  const response = new ImageResponse(
    (
      <div
        style={{
          width: "600px",
          height: "840px",
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(165deg, #0f1c2e 0%, #162d4a 45%, #0d1a2a 100%)",
          color: "white",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top line */}
        <div
          style={{
            display: "flex",
            height: "8px",
            width: "100%",
            background: "linear-gradient(90deg, #1e63f1, #5b9aff)",
          }}
        />

        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "28px 36px 0",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background: "#1e63f1",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "15px",
                fontWeight: 700,
                marginRight: "12px",
              }}
            >
              IF
            </div>
            <div
              style={{
                display: "flex",
                fontSize: "18px",
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              innovate finance
            </div>
          </div>

          <div
            style={{
              display: "flex",
              border: "1px solid rgba(255,255,255,0.22)",
              borderRadius: "999px",
              padding: "7px 14px",
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

        {/* Body */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "52px 36px 0",
            flex: 1,
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#7eb0ff",
              marginBottom: "18px",
            }}
          >
            Women in FinTech
          </div>

          <div
            style={{
              display: "flex",
              fontSize: "58px",
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: "-0.04em",
            }}
          >
            Powerlist
          </div>

          <div
            style={{
              display: "flex",
              fontSize: "58px",
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: "-0.04em",
              color: "#5b9aff",
              marginBottom: "40px",
            }}
          >
            2026
          </div>

          <div style={{ display: "flex", flex: 1 }} />

          {/* Profile + Issued to */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "36px",
            }}
          >
            {/* Profile image */}
            {imageUrl ? (
              <img
                src={imageUrl}
                width={88}
                height={88}
                style={{
                  width: "88px",
                  height: "88px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "3px solid rgba(91,154,255,0.6)",
                  marginRight: "20px",
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  width: "88px",
                  height: "88px",
                  borderRadius: "50%",
                  background: "#1e63f1",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "28px",
                  fontWeight: 700,
                  marginRight: "20px",
                  border: "3px solid rgba(91,154,255,0.6)",
                }}
              >
                {name.charAt(0).toUpperCase()}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
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
                  display: "flex",
                  fontSize: "26px",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  maxWidth: "360px",
                }}
              >
                {name}
              </div>
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
            width: "100%",
          }}
        >
          <div style={{ display: "flex" }}>Avalanche Network</div>
          <div style={{ display: "flex" }}>1 of 1 · #{tokenId}</div>
        </div>
      </div>
    ),
    {
      width: 600,
      height: 840,
    }
  );

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}