import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, parseAbi } from "viem";
import { avalancheFuji } from "viem/chains";

const CONTRACT_ADDRESS =
  process.env.NFT_CONTRACT_ADDRESS as `0x${string}`;

const RPC_URL =
  process.env.AVALANCHE_RPC_URL ||
  "https://api.avax-test.network/ext/bc/C/rpc";

const abi = parseAbi([
  "function hasMinted(address) view returns (bool)",
  "function remainingSupply() view returns (uint256)",
]);

export async function GET(req: NextRequest) {
  try {
    const wallet = req.nextUrl.searchParams.get("wallet");

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return NextResponse.json(
        { error: "Invalid wallet address" },
        { status: 400 }
      );
    }

    if (!CONTRACT_ADDRESS) {
      return NextResponse.json(
        { error: "NFT contract is not configured" },
        { status: 500 }
      );
    }

    const publicClient = createPublicClient({
      chain: avalancheFuji,
      transport: http(RPC_URL),
    });

    const alreadyMinted = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi,
      functionName: "hasMinted",
      args: [wallet as `0x${string}`],
    });

    const remainingSupply = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi,
      functionName: "remainingSupply",
    });

    return NextResponse.json({
      success: true,
      wallet,
      hasMinted: alreadyMinted,
      remainingSupply: remainingSupply.toString(),
    });
  } catch (err: any) {
    console.error("Wallet check error:", err);

    return NextResponse.json(
      {
        error:
          err?.shortMessage ||
          err?.message ||
          "Unable to check wallet",
      },
      { status: 500 }
    );
  }
}