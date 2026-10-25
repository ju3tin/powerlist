
import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { PinataSDK } from "pinata";

export const runtime = "nodejs";
export const maxDuration = 60;

const FUJI_CHAIN_ID = 43113;
const MAX_TICKET_BYTES = 10 * 1024 * 1024;

const ABI = [
  "function mintTo(address to, string name, string tokenURI, string hash) external returns (uint256)",
  "function isHashUsed(string hash) view returns (bool)",
  "function hasNFT(address account) view returns (bool)",
  "function remainingSupply() view returns (uint256)",
];

type NftSelection = {
  _id: string;
  year?: number;
  profileId: string;
  category?: string;
  companyLogo?: string;
  email?: string;
  imageUrl?: string;
  jobTitle?: string;
  name?: string;
  mintStatus?: string;
  recipientSelected?: boolean;
  status?: string;
  ticketConfig?: Record<string, unknown>;
  tokenId?: string;
  transactionHash?: string;
  wallet?: string;
  linkedinUrl?: string;
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

function buildTicketPayload(selection: NftSelection) {
  // Adapt these keys to the exact schema expected by
  // /api/preview-ticket3 in your project.
  return {
    name: selection.name ?? "",
    jobTitle: selection.jobTitle ?? "",
    imageUrl: selection.imageUrl ?? "",
    companyLogo: selection.companyLogo ?? "",
    category: selection.category ?? "",
    ticketConfig: selection.ticketConfig ?? {},
  };
}

async function getResponseError(response: Response): Promise<string> {
  const text = await response.text().catch(() => "");
  return text.slice(0, 300) || `HTTP ${response.status}`;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Validate the request.
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

    // 2. Validate server configuration.
    const appUrl = new URL(requiredEnv("APP_URL"));
    const rpcUrl = requiredEnv("RPC_URL");
    const privateKey = requiredEnv("PRIVATE_KEY");
    const contractAddress = requiredEnv("NFT_CONTRACT_ADDRESS");
    const pinataJwt = requiredEnv("PINATA_JWT");

    if (
      appUrl.protocol !== "https:" &&
      appUrl.hostname !== "localhost"
    ) {
      throw new Error("APP_URL must use HTTPS");
    }

    if (!ethers.isAddress(contractAddress)) {
      throw new Error("NFT_CONTRACT_ADDRESS is invalid");
    }

    // 3. Connect to Avalanche Fuji.
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const network = await provider.getNetwork();

    if (network.chainId !== BigInt(FUJI_CHAIN_ID)) {
      throw new Error(
        `Wrong network: expected Fuji chain ID ${FUJI_CHAIN_ID}, got ${network.chainId}`
      );
    }

    const signer = new ethers.Wallet(privateKey, provider);

    const contract = new ethers.Contract(
      ethers.getAddress(contractAddress),
      ABI,
      signer
    );

    // Initialize Pinata inside the request handler so missing
    // configuration does not break module initialization.
    const pinata = new PinataSDK({ pinataJwt });

    // 4. Fetch selections from /api/nft-selections.
    const selectionsUrl = new URL(
      "/api/nft-selections",
      appUrl
    );

    const selectionsResponse = await fetch(selectionsUrl, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });

    if (!selectionsResponse.ok) {
      throw new Error(
        `NFT selections API failed: ${selectionsResponse.status}`
      );
    }

    const selectionsData = await selectionsResponse.json();

    if (
      selectionsData?.success !== true ||
      !Array.isArray(selectionsData.selections)
    ) {
      throw new Error("Invalid NFT selections API response");
    }

    const selections: NftSelection[] = selectionsData.selections;

    // Use profileId, not the selection's MongoDB _id.
    const selection = selections.find(
      (item) => String(item.profileId) === profileId
    );

    if (!selection) {
      return NextResponse.json(
        { error: "No selection found for this profileId" },
        { status: 404 }
      );
    }

    // 5. Validate selection eligibility.
    // Change "selected" if your application uses another
    // status to identify eligible selections.
    if (selection.status !== "selected") {
      return NextResponse.json(
        { error: "This selection is not eligible for minting" },
        { status: 409 }
      );
    }

    if (selection.mintStatus === "minted") {
      return NextResponse.json(
        { error: "This selection has already been minted" },
        { status: 409 }
      );
    }

    const name =
      typeof selection.name === "string"
        ? selection.name.trim()
        : "";

    if (!name || name.length > 200) {
      return NextResponse.json(
        { error: "The selection has an invalid name" },
        { status: 400 }
      );
    }

    // 6. Check on-chain eligibility before uploading files.
    const [hashUsed, walletHasNft, remainingSupply] =
      await Promise.all([
        contract.isHashUsed(profileId),
        contract.hasNFT(recipient),
        contract.remainingSupply(),
      ]);

    if (hashUsed) {
      return NextResponse.json(
        { error: "This profile has already been minted" },
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

    // 7. Generate the personalized ticket PNG.
    const ticketUrl = new URL(
      "/api/preview-ticket3",
      appUrl
    );

    const ticketResponse = await fetch(ticketUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "image/png",
      },
      body: JSON.stringify(buildTicketPayload(selection)),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });

    if (!ticketResponse.ok) {
      throw new Error(
        `Ticket generation failed: ${await getResponseError(ticketResponse)}`
      );
    }

    const contentType =
      ticketResponse.headers.get("content-type") ?? "";

    if (!contentType.toLowerCase().includes("image/png")) {
      throw new Error(
        `Expected a PNG from ticket generator, received: ${contentType}`
      );
    }

    const declaredLength = Number(
      ticketResponse.headers.get("content-length") ?? "0"
    );

    if (declaredLength > MAX_TICKET_BYTES) {
      throw new Error("Generated ticket exceeds the 10 MB limit");
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

    // Validate the PNG signature.
    const pngSignature = [
      137, 80, 78, 71, 13, 10, 26, 10,
    ];

    if (
      !pngSignature.every(
        (byte, index) => ticketBytes[index] === byte
      )
    ) {
      throw new Error("Ticket generator did not return a valid PNG");
    }

    // 8. Upload the personalized ticket to Pinata.
    const imageFile = new File(
      [ticketBytes],
      `ticket-${profileId}.png`,
      { type: "image/png" }
    );

    const imageUpload = await pinata.upload.public.file(imageFile);
    const imageCid = imageUpload.cid;

    if (!imageCid) {
      throw new Error("Pinata image upload returned no CID");
    }

    // 9. Build and upload NFT metadata.
    const metadata = {
      name: `${name} - Innovate Finance Powerlist Ticket`,
      description:
        typeof selection.jobTitle === "string" &&
        selection.jobTitle.trim()
          ? `${name} — ${stripHtml(selection.jobTitle)}`
          : `${name} - Innovate Finance Powerlist Ticket`,
      image: `ipfs://${imageCid}`,
      attributes: [
        { trait_type: "Profile ID", value: profileId },
        {
          trait_type: "Year",
          value: selection.year ?? new Date().getFullYear(),
        },
        {
          trait_type: "Category",
          value: selection.category ?? "",
        },
        {
          trait_type: "Job Title",
          value: selection.jobTitle ?? "",
        },
      ],
    };

    const metadataUpload =
      await pinata.upload.public.json(metadata);

    const metadataCid = metadataUpload.cid;

    if (!metadataCid) {
      throw new Error("Pinata metadata upload returned no CID");
    }

    const tokenURI = `ipfs://${metadataCid}`;

    // 10. Mint using the server wallet.
    // The smart contract MUST enforce uniqueness and supply
    // restrictions atomically, even if concurrent requests occur.
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

    // 11. Return the confirmed mint details.
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
    console.error("NFT mint route failed:", error);

    return NextResponse.json(
      { error: "NFT mint failed. Please try again later." },
      { status: 500 }
    );
  }
}
