import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { avalancheFuji } from "viem/chains";
import { uploadImageToPinata, uploadJSONToPinata } from "@/lib/pinata";

const CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS as `0x${string}`;
const PRIVATE_KEY = process.env.MINTER_PRIVATE_KEY as `0x${string}`;
const RPC_URL =
  process.env.AVALANCHE_RPC_URL ||
  "https://api.avax-test.network/ext/bc/C/rpc";

const abi = parseAbi([
  "function mintTo(address to, string name, string tokenURI, string hash) returns (uint256)",
  "function hasMinted(address) view returns (bool)",
  "function remainingSupply() view returns (uint256)",
  "function isHashUsed(string) view returns (bool)",
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { wallet, name, email, image, linkedinId } = body;

    if (!wallet || !name) {
      return NextResponse.json(
        { error: "Missing wallet or name" },
        { status: 400 }
      );
    }

    if (!CONTRACT_ADDRESS || !PRIVATE_KEY || !process.env.PINATA_JWT) {
      return NextResponse.json(
        { error: "Server misconfigured" },
        { status: 500 }
      );
    }

    const account = privateKeyToAccount(PRIVATE_KEY);

    const publicClient = createPublicClient({
      chain: avalancheFuji,
      transport: http(RPC_URL),
    });

    const walletClient = createWalletClient({
      account,
      chain: avalancheFuji,
      transport: http(RPC_URL),
    });

    // ---- Checks ----
    const alreadyMinted = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi,
      functionName: "hasMinted",
      args: [wallet as `0x${string}`],
    });

    if (alreadyMinted) {
      return NextResponse.json(
        { error: "This wallet already has an NFT" },
        { status: 400 }
      );
    }

    const remaining = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi,
      functionName: "remainingSupply",
    });

    if (remaining === 0n) {
      return NextResponse.json(
        { error: "Max supply reached" },
        { status: 400 }
      );
    }

    const hash = linkedinId
      ? `linkedin:${linkedinId}`
      : `wallet:${wallet.toLowerCase()}`;

    const hashUsed = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi,
      functionName: "isHashUsed",
      args: [hash],
    });

    if (hashUsed) {
      return NextResponse.json(
        { error: "This profile already claimed" },
        { status: 400 }
      );
    }

    // =====================================================
    // 1. Upload image to IPFS
    // =====================================================
    let imageIpfs = "";

    if (image) {
      // Use LinkedIn profile picture
      imageIpfs = await uploadImageToPinata(image, `${name.replace(/\s+/g, "-")}.jpg`);
    } else {
      // Fallback: generate initials avatar
      const fallback = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
      imageIpfs = await uploadImageToPinata(fallback, `${name.replace(/\s+/g, "-")}.svg`);
    }

    // Convert ipfs:// to a gateway URL for metadata
    const imageGateway = imageIpfs.replace(
      "ipfs://",
      "https://gateway.pinata.cloud/ipfs/"
    );

    // =====================================================
    // 2. Create & upload metadata JSON
    // =====================================================
    const metadata = {
      name: `${name} – Innovate Finance Powerlist 2026`,
      description: `Official Women in FinTech Powerlist 2026 ticket for ${name}.`,
      image: imageIpfs, // keep ipfs:// in metadata
      external_url: "https://powerlist-nine.vercel.app",
      attributes: [
        { trait_type: "Event", value: "Powerlist 2026" },
        { trait_type: "Name", value: name },
        ...(email ? [{ trait_type: "Email", value: email }] : []),
        { trait_type: "Network", value: "Avalanche Fuji" },
      ],
    };

    const tokenURI = await uploadJSONToPinata(metadata);

    // =====================================================
    // 3. Mint on-chain
    // =====================================================
    const txHash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi,
      functionName: "mintTo",
      args: [wallet as `0x${string}`, name, tokenURI, hash],
    });

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    return NextResponse.json({
      success: true,
      name,
      txHash,
      tokenURI,
      image: imageGateway,
      blockNumber: receipt.blockNumber.toString(),
    });
  } catch (err: any) {
    console.error("Mint error:", err);
    return NextResponse.json(
      { error: err?.shortMessage || err?.message || "Mint failed" },
      { status: 500 }
    );
  }
}