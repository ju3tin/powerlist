import { ImageResponse } from "@vercel/og";

type TicketParams = {
  name: string;
  tokenId?: string;
};

export async function generateTicketImage({
  name,
  tokenId = "001",
}: TicketParams): Promise<Buffer> {
  const response = new ImageResponse(
    (
      <div
        style={{
          width: "600px",
          height: "840px",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(165deg, #0f1c2e 0%, #162d4a 45%, #0d1a2a 100%)",
          color: "white",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top blue line */}
        <div
          style={{
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
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background: "#1e63f1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "15px",
                fontWeight: 700,
              }}
            >
              IF
            </div>
            <span
              style={{
                fontSize: "18px",
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              innovate finance
            </span>
          </div>

          <div
            style={{
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
          }}
        >
          <div
            style={{
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
              fontSize: "58px",
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: "-0.04em",
              color: "#5b9aff",
              marginBottom: "56px",
            }}
          >
            2026
          </div>

          {/* Decorative rings */}
          <div
            style={{
              position: "absolute",
              right: "-50px",
              top: "190px",
              width: "210px",
              height: "210px",
              borderRadius: "50%",
              border: "1px solid rgba(91,154,255,0.28)",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: "-95px",
              top: "250px",
              width: "300px",
              height: "300px",
              borderRadius: "50%",
              border: "1px solid rgba(91,154,255,0.14)",
            }}
          />

          {/* Issued to */}
          <div style={{ marginTop: "auto", marginBottom: "36px" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#7a91a8",
                marginBottom: "10px",
              }}
            >
              Issued to
            </div>
            <div
              style={{
                fontSize: "30px",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                maxWidth: "440px",
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
          <span>1 of 1 · #{tokenId}</span>
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