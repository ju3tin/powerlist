
import { NextRequest, NextResponse } from "next/server";
import {
  createWalletClient,
  createPublicClient,
  http,
  parseAbi,
  isAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { avalancheFuji } from "viem/chains";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTRACT_ADDRESS =
  process.env.NFT_CONTRACT_ADDRESS as `0x${string}`;

const PRIVATE_KEY =
  process.env.MINTER_PRIVATE_KEY as `0x${string}`;

const RPC_URL =
  process.env.AVALANCHE_RPC_URL ||
  "https://api.avax-test.network/ext/bc/C/rpc";

const APP_URL = process.env.APP_URL;

const abi = parseAbi([
  "function mintTo(address to, string name, string tokenURI, string hash) returns (uint256)",
  "function hasMinted(address) view returns (bool)",
  "function remainingSupply() view returns (uint256)",
  "function isHashUsed(string) view returns (bool)",
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const profileId = body?.profileId;
    const wallet = body?.wallet;

    // Validate request
    if (
      typeof profileId !== "string" ||
      !/^[a-fA-F0-9]{24}$/.test(profileId)
    ) {
      return NextResponse.json(
        { error: "A valid profileId is required." },
        { status: 400 }
      );
    }

    if (typeof wallet !== "string" || !isAddress(wallet)) {
      return NextResponse.json(
        { error: "A valid recipient wallet address is required." },
        { status: 400 }
      );
    }

    if (
      !CONTRACT_ADDRESS ||
      !PRIVATE_KEY ||
      !APP_URL
    ) {
      return NextResponse.json(
        { error: "Missing server environment configuration." },
        { status: 500 }
      );
    }

    // Validate configuration
    if (!isAddress(CONTRACT_ADDRESS)) {
      throw new Error("NFT_CONTRACT_ADDRESS is invalid.");
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

    // Verify RPC chain
    const chainId = await publicClient.getChainId();

    if (chainId !== 43113) {
      throw new Error("RPC is not connected to Avalanche Fuji.");
    }

    // Find selection using profileId
    const selectionsResponse = await fetch(
      `${APP_URL.replace(/\/$/, "")}/api/nft-selections`,
      { cache: "no-store" }
    );

    if (!selectionsResponse.ok) {
      throw new Error("Could not load NFT selections.");
    }

    const selectionsData = await selectionsResponse.json();

    const selection = selectionsData.selections?.find(
      (item: { profileId: string }) =>
        item.profileId === profileId
    );

    if (!selection) {
      return NextResponse.json(
        { error: "Selection not found." },
        { status: 404 }
      );
    }

    // Enforce eligibility
    if (selection.status !== "selected") {
      return NextResponse.json(
        { error: "This profile is not eligible to mint." },
        { status: 409 }
      );
    }

    if (selection.mintStatus === "minted") {
      return NextResponse.json(
        { error: "This profile has already been minted." },
        { status: 409 }
      );
    }

    const contractAddress = CONTRACT_ADDRESS;

    // Check contract restrictions
    const [alreadyMinted, hashUsed, remaining] =
      await Promise.all([
        publicClient.readContract({
          address: contractAddress,
          abi,
          functionName: "hasMinted",
          args: [wallet],
        }),
        publicClient.readContract({
          address: contractAddress,
          abi,
          functionName: "isHashUsed",
          args: [profileId],
        }),
        publicClient.readContract({
          address: contractAddress,
          abi,
          functionName: "remainingSupply",
        }),
      ]);

    if (alreadyMinted) {
      return NextResponse.json(
        { error: "This wallet already has an NFT." },
        { status: 409 }
      );
    }

    if (hashUsed) {
      return NextResponse.json(
        { error: "This profile has already been minted." },
        { status: 409 }
      );
    }

    if (remaining <= 0n) {
      return NextResponse.json(
        { error: "The NFT collection is sold out." },
        { status: 409 }
      );
    }

    // Generate ticket PNG and upload image + metadata to Pinata
    const uploadResponse = await fetch(
      `${APP_URL.replace(/\/$/, "")}/api/upload-ticket-metadata`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId }),
        cache: "no-store",
      }
    );

    const uploadData = await uploadResponse.json();

    if (!uploadResponse.ok || !uploadData.success) {
      throw new Error(
        uploadData.error || "Ticket upload to IPFS failed."
      );
    }

    const metadataUri = uploadData.metadata?.uri;

    if (
      typeof metadataUri !== "string" ||
      !metadataUri.startsWith("ipfs://")
    ) {
      throw new Error("Invalid metadata URI returned by Pinata.");
    }

    // Mint NFT; the server wallet pays gas
    const txHash = await walletClient.writeContract({
      address: contractAddress,
      abi,
      functionName: "mintTo",
      args: [
        wallet,
        selection.name,
        metadataUri,
        profileId,
      ],
    });

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    if (receipt.status !== "success") {
      throw new Error("The mint transaction reverted.");
    }

    // Return transaction details
    return NextResponse.json({
      success: true,
      message: "NFT minted successfully.",
      profileId,
      wallet,
      name: selection.name,
      image: uploadData.image.uri,
      metadataUri,
      txHash,
      blockNumber: receipt.blockNumber.toString(),
      explorerUrl: `https://testnet.snowtrace.io/tx/${txHash}`,
    });
  } catch (err: unknown) {
    console.error("Mint error:", err);

    const message =
      err instanceof Error ? err.message : "Mint failed.";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
