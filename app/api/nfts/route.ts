import { NextResponse } from "next/server";
import { createPublicClient, http, parseAbi } from "viem";
import { avalancheFuji } from "viem/chains";

const CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS as `0x${string}`;
const RPC_URL = process.env.AVALANCHE_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";

const abi = parseAbi([
  "function totalSupply() view returns (uint256)",
  "function tokenURI(uint256) view returns (string)",
  "function tokenName(uint256) view returns (string)",
  "function tokenHash(uint256) view returns (string)",
  "function ownerOf(uint256) view returns (address)",
]);

export async function GET() {
  try {
    const client = createPublicClient({
      chain: avalancheFuji,
      transport: http(RPC_URL),
    });

    const total = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi,
      functionName: "totalSupply",
    });

    const nfts = [];

    for (let i = 1n; i <= total; i++) {
      const [name, uri, hash, owner] = await Promise.all([
        client.readContract({
          address: CONTRACT_ADDRESS,
          abi,
          functionName: "tokenName",
          args: [i],
        }),
        client.readContract({
          address: CONTRACT_ADDRESS,
          abi,
          functionName: "tokenURI",
          args: [i],
        }),
        client.readContract({
          address: CONTRACT_ADDRESS,
          abi,
          functionName: "tokenHash",
          args: [i],
        }),
        client.readContract({
          address: CONTRACT_ADDRESS,
          abi,
          functionName: "ownerOf",
          args: [i],
        }),
      ]);

      nfts.push({
        tokenId: i.toString(),
        name,
        tokenURI: uri,
        hash,
        owner,
      });
    }

    return NextResponse.json({ total: total.toString(), nfts });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}