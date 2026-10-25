
import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { PinataSDK } from "pinata";

export const runtime = "nodejs";
export const maxDuration = 60;

const FUJI_CHAIN_ID = 43113;
const MAX_TICKET_BYTES = 10 * 1024 * 1024;

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
});

const ABI = [
  "function mintTo(address to, string name, string tokenURI, string hash) external returns (uint256)",
  "function isHashUsed(string hash) view returns (bool)",
  "function hasNFT(address account) view returns (bool)",
  "function remainingSupply() view returns (uint256)",
];

type InnovatePerson = {
  id: string | number;
  title?: string;
  content?: string;
  featured_image?: string;
  artist_title?: string;
  date?: string;
  link?: string;
  [key: string]: unknown;
};

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value.trim();
}

function stripHtml(value: string, maxLength = 400): string {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

/**
 * Adapt this to the exact JSON input expected by /api/preview-ticket3.
 */
function buildTicketPayload(person: InnovatePerson) {
  return { person };
}

export async function POST(req: NextRequest) {
  try {
    // 1. Validate request.
    let body: { wallet?: unknown; profileId?: unknown };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Request body must be valid JSON" },
        { status: 400 }
      );
    }

    const walletInput =
      typeof body.wallet === "string" ? body.wallet.trim() : "";

    const profileId =
      typeof body.profileId === "string" ||
      typeof body.profileId === "number"
        ? String(body.profileId).trim()
        : "";

    if (!ethers.isAddress(walletInput)) {
      return NextResponse.json(
        { error: "A valid wallet address is required" },
        { status: 400 }
      );
    }

    if (!profileId || profileId.length > 200) {
      return NextResponse.json(
        { error: "A valid profileId is required" },
        { status: 400 }
      );
    }

    const recipient = ethers.getAddress(walletInput);

    // 2. Connect to Avalanche Fuji and the NFT contract.
    const provider = new ethers.JsonRpcProvider(
      requiredEnv("RPC_URL")
    );

    const network = await provider.getNetwork();

    if (network.chainId !== BigInt(FUJI_CHAIN_ID)) {
      throw new Error(
        `Wrong network: expected Fuji chain ID ${FUJI_CHAIN_ID}`
      );
    }

    const signer = new ethers.Wallet(
      requiredEnv("PRIVATE_KEY"),
      provider
    );

    const contract = new ethers.Contract(
      ethers.getAddress(requiredEnv("NFT_CONTRACT_ADDRESS")),
      ABI,
      signer
    );

    // 3. Fetch the Innovate Finance profile by ID.
    const apiResponse = await fetch(
      requiredEnv("INNOVATE_API_URL"),
      {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      }
    );

    if (!apiResponse.ok) {
      throw new Error(
        `Innovate Finance API returned ${apiResponse.status}`
      );
    }

    const apiData = await apiResponse.json();

    const people: InnovatePerson[] = Array.isArray(apiData)
      ? apiData
      : apiData?.data;

    if (!Array.isArray(people)) {
      throw new Error("Unexpected Innovate Finance API response");
    }

    const person = people.find(
      (p) => String(p.id) === profileId
    );

    if (!person) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    const name =
      typeof person.title === "string" ? person.title.trim() : "";

    if (!name || name.length > 200) {
      throw new Error("Profile has an invalid name");
    }

    // 4. Check mint eligibility before uploading anything.
    const [hashUsed, walletHasNft, remainingSupply] =
      await Promise.all([
        contract.isHashUsed(profileId),
        contract.hasNFT(recipient),
        contract.remainingSupply(),
      ]);

    if (hashUsed) {
      return NextResponse.json(
        { error: "This profile NFT has already been claimed" },
        { status: 409 }
      );
    }

    if (walletHasNft) {
      return NextResponse.json(
        { error: "This wallet already has an NFT" },
        { status: 409 }
      );
    }

    if (remainingSupply === 0n) {
      return NextResponse.json(
        { error: "All NFTs have been minted" },
        { status: 409 }
      );
    }

    // 5. Generate the personalized ticket PNG.
    const appUrl = new URL(requiredEnv("APP_URL"));

    if (
      appUrl.protocol !== "https:" &&
      appUrl.hostname !== "localhost"
    ) {
      throw new Error("APP_URL must use HTTPS");
    }

    const ticketResponse = await fetch(
      new URL("/api/preview-ticket3", appUrl),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildTicketPayload(person)),
        cache: "no-store",
        signal: AbortSignal.timeout(30_000),
      }
    );

    if (!ticketResponse.ok) {
      throw new Error(
        `Ticket generation failed with HTTP ${ticketResponse.status}`
      );
    }

    const contentType =
      ticketResponse.headers.get("content-type") ?? "";

    if (!contentType.toLowerCase().startsWith("image/png")) {
      throw new Error(
        `Ticket generator did not return PNG: ${contentType}`
      );
    }

    const declaredSize = Number(
      ticketResponse.headers.get("content-length") ?? "0"
    );

    if (declaredSize > MAX_TICKET_BYTES) {
      throw new Error("Generated ticket exceeds 10 MB");
    }

    const ticketBytes = new Uint8Array(
      await ticketResponse.arrayBuffer()
    );

    if (
      ticketBytes.length === 0 ||
      ticketBytes.length > MAX_TICKET_BYTES
    ) {
      throw new Error("Generated ticket is empty or too large");
    }

    const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];

    if (
      !pngSignature.every(
        (byte, index) => ticketBytes[index] === byte
      )
    ) {
      throw new Error("Generated ticket is not a valid PNG");
    }

    // 6. Upload ticket image to Pinata.
    const imageFile = new File(
      [ticketBytes],
      `ticket-${profileId}.png`,
      { type: "image/png" }
    );

    const imageUpload = await pinata.upload.public.file(imageFile);
    const imageCid = imageUpload.cid;

    if (!imageCid) {
      throw new Error("Image upload did not return a CID");
    }

    // 7. Upload NFT metadata.
    const metadata = {
      name: `${name} - Innovate Finance Powerlist Ticket`,
      description: person.content
        ? stripHtml(person.content)
        : `${name} - Official profile ticket`,
      image: `ipfs://${imageCid}`,
      external_url:
        typeof person.link === "string" ? person.link : undefined,
      attributes: [
        { trait_type: "Profile ID", value: profileId },
        {
          trait_type: "Role",
          value:
            typeof person.artist_title === "string"
              ? person.artist_title
              : "Member",
        },
        {
          trait_type: "Date",
          value:
            typeof person.date === "string" ? person.date : "",
        },
      ],
    };

    const metadataUpload =
      await pinata.upload.public.json(metadata);

    if (!metadataUpload.cid) {
      throw new Error("Metadata upload did not return a CID");
    }

    const tokenURI = `ipfs://${metadataUpload.cid}`;

    // 8. Mint with the server wallet.
    // The contract must enforce duplicate and supply rules itself.
    const tx = await contract.mintTo(
      recipient,
      name,
      tokenURI,
      profileId
    );

    const receipt = await tx.wait();

    if (!receipt || receipt.status !== 1) {
      throw new Error(`Mint transaction failed: ${tx.hash}`);
    }

    return NextResponse.json({
      success: true,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      recipient,
      name,
      profileId,
      tokenURI,
      image: `ipfs://${imageCid}`,
      imageGatewayUrl:
        `https://gateway.pinata.cloud/ipfs/${imageCid}`,
    });
  } catch (error: unknown) {
    console.error("NFT mint error:", error);

    // Avoid leaking provider or contract internals to callers.
    return NextResponse.json(
      { error: "NFT mint failed. Please try again later." },
      { status: 500 }
    );
  }
}
