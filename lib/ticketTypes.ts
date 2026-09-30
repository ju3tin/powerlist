// Client-safe — no sharp / Node imports

export type TextLayer = {
    id: string;
    type: "text";
    content: string;
    x: number;
    y: number;
    fontSize: number;
    color: string;
    fontFamily?: string;
    fontWeight?: number;
    letterSpacing?: string;
    textTransform?: "none" | "uppercase";
    maxWidth?: number;
    opacity?: number;
    visible?: boolean;
  };
  
  export type ImageLayer = {
    id: string;
    type: "image";
    src: string; // "avatar" | "company_logo" | url
    x: number;
    y: number;
    width: number;
    height: number;
    borderRadius?: number;
    borderColor?: string;
    borderWidth?: number;
    opacity?: number;
    visible?: boolean;
    objectFit?: "cover" | "contain";
  };
  
  export type TicketLayer = TextLayer | ImageLayer;
  
  export type BackgroundConfig =
    | { type: "gradient"; value: string }
    | { type: "color"; value: string }
    | { type: "image"; value: string };
  
  export type TicketConfig = {
    background: BackgroundConfig;
    fontFamily?: string;
    width?: number;
    height?: number;
    showTopBar?: boolean;
    layers: TicketLayer[];
  };
  
  export type TicketParams = {
    name: string;
    tokenId?: string;
    imageUrl?: string;
    role?: string;
    category?: string;
    year?: string;
    companyLogo?: string;
    linkedinUrl?: string;
    config?: TicketConfig;
  };
  
  export const TICKET_FONTS = [
    "Inter",
    "Space Grotesk",
    "IBM Plex Sans",
    "Geist",
    "Roboto",
    "Open Sans",
    "Montserrat",
    "Poppins",
    "Playfair Display",
    "Merriweather",
    "system",
  ] as const;
  
  export type TicketFont = (typeof TICKET_FONTS)[number];
  
  export const defaultTicketConfig: TicketConfig = {
    width: 600,
    height: 840,
    fontFamily: "Inter",
    showTopBar: true,
    background: {
      type: "gradient",
      value: "linear-gradient(165deg, #0f1c2e 0%, #162d4a 45%, #0d1a2a 100%)",
    },
    layers: [
      {
        id: "brand-initials",
        type: "text",
        content: "IF",
        x: 36,
        y: 40,
        fontSize: 15,
        color: "#ffffff",
        fontFamily: "Inter",
        fontWeight: 700,
        visible: true,
      },
      {
        id: "brand-name",
        type: "text",
        content: "innovate finance",
        x: 90,
        y: 42,
        fontSize: 18,
        color: "#ffffff",
        fontFamily: "Inter",
        fontWeight: 700,
        visible: true,
      },
      {
        id: "badge",
        type: "text",
        content: "Digital Ticket",
        x: 420,
        y: 44,
        fontSize: 11,
        color: "#a8c0d8",
        fontFamily: "Inter",
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        visible: true,
      },
      {
        id: "event-label",
        type: "text",
        content: "Women in FinTech",
        x: 36,
        y: 140,
        fontSize: 13,
        color: "#7eb0ff",
        fontFamily: "Inter",
        fontWeight: 700,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        visible: true,
      },
      {
        id: "title",
        type: "text",
        content: "Powerlist",
        x: 36,
        y: 175,
        fontSize: 58,
        color: "#ffffff",
        fontFamily: "Inter",
        fontWeight: 700,
        visible: true,
      },
      {
        id: "year",
        type: "text",
        content: "{{year}}",
        x: 36,
        y: 240,
        fontSize: 58,
        color: "#5b9aff",
        fontFamily: "Inter",
        fontWeight: 700,
        visible: true,
      },
      {
        id: "avatar",
        type: "image",
        src: "avatar",
        x: 36,
        y: 620,
        width: 88,
        height: 88,
        borderRadius: 999,
        borderColor: "rgba(91,154,255,0.6)",
        borderWidth: 3,
        visible: true,
        objectFit: "cover",
      },
      {
        id: "issued-label",
        type: "text",
        content: "Issued to",
        x: 144,
        y: 630,
        fontSize: 11,
        color: "#7a91a8",
        fontFamily: "Inter",
        fontWeight: 700,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        visible: true,
      },
      {
        id: "name",
        type: "text",
        content: "{{name}}",
        x: 144,
        y: 652,
        fontSize: 26,
        color: "#ffffff",
        fontFamily: "Inter",
        fontWeight: 600,
        maxWidth: 360,
        visible: true,
      },
      {
        id: "role",
        type: "text",
        content: "{{role}}",
        x: 144,
        y: 688,
        fontSize: 16,
        color: "#a8c0d8",
        fontFamily: "Inter",
        fontWeight: 500,
        maxWidth: 360,
        visible: true,
      },
      {
        id: "network",
        type: "text",
        content: "Avalanche Network",
        x: 36,
        y: 800,
        fontSize: 11,
        color: "#7a91a8",
        fontFamily: "Inter",
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        visible: true,
      },
      {
        id: "token",
        type: "text",
        content: "1 of 1 · #{{tokenId}}",
        x: 400,
        y: 800,
        fontSize: 11,
        color: "#7a91a8",
        fontFamily: "Inter",
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        visible: true,
      },
    ],
  };