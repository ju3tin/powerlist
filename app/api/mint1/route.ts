import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { avalancheFuji } from "viem/chains";

// ============ Config ============
const CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS as `0x${string}`;
const PRIVATE_KEY = process.env.MINTER_PRIVATE_KEY as `0x${string}`; // owner wallet
const RPC_URL = process.env.AVALANCHE_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";

// Minimal ABI for the functions we need
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

    // ---- Validation ----
    if (!wallet || !name) {
      return NextResponse.json(
        { error: "Missing wallet or name" },
        { status: 400 }
      );
    }

    if (!CONTRACT_ADDRESS || !PRIVATE_KEY) {
      return NextResponse.json(
        { error: "Server misconfigured – missing contract or private key" },
        { status: 500 }
      );
    }

    // ---- Clients ----
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

    // ---- Pre-checks ----
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
        { error: "Max supply of 200 reached" },
        { status: 400 }
      );
    }

    // Create a unique hash (you can change this logic)
    // Using linkedinId + wallet is a good unique key
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
        { error: "This profile has already claimed an NFT" },
        { status: 400 }
      );
    }

    // ---- Build metadata / tokenURI ----
    // For now we use a simple placeholder.
    // Later you can upload to Pinata / IPFS and put the real URI here.
    const tokenURI =
      image ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

    // ---- Mint ----
    const hashTx = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi,
      functionName: "mintTo",
      args: [wallet as `0x${string}`, name, tokenURI, hash],
    });

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: hashTx,
    });

    return NextResponse.json({
      success: true,
      name,
      txHash: hashTx,
      tokenId: null, // you can parse logs later if needed
      image: tokenURI,
      blockNumber: receipt.blockNumber.toString(),
    });
  } catch (err: any) {
    console.error("Mint error:", err);

    // Common revert messages
    const message =
      err?.shortMessage ||
      err?.message ||
      "Mint failed";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}