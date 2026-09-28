import { generateTicketImage } from "@/lib/getnerateticket";
import { privateKeyToAccount } from "viem/accounts";
import { avalancheFuji } from "viem/chains";
import { createWalletClient, createPublicClient, http, parseAbi } from "viem";
import { uploadBufferToPinata, uploadJSONToPinata } from "@/lib/pinata1";
const name = "sd";
const CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS as `0x${string}`;
const PRIVATE_KEY123 = process.env.MINTER_PRIVATE_KEY as `0x${string}`;
const RPC_URL =
  process.env.AVALANCHE_RPC_URL ||
  "https://api.avax-test.network/ext/bc/C/rpc";

const publicClient = createPublicClient({
  chain: avalancheFuji,
  transport: http(RPC_URL),
});
// ... inside POST, after checks ...

// 1. Generate custom ticket image
const account = privateKeyToAccount(PRIVATE_KEY123);
const wallet = account.address;
const hash = crypto.randomUUID();

const walletClient = createWalletClient({
  account,
  chain: avalancheFuji,
  transport: http(RPC_URL),
});

const abi = parseAbi([
  "function mintTo(address to, string name, string tokenURI, string hash) returns (uint256)",
  "function hasMinted(address) view returns (bool)",
  "function remainingSupply() view returns (uint256)",
  "function isHashUsed(string) view returns (bool)",
]);
const imageBuffer = await generateTicketImage({
  name: "sd",
  tokenId: "NEW", // or leave blank
});

// 2. Upload image to IPFS
const imageIpfs = await uploadBufferToPinata(
  imageBuffer,
  `powerlist-2026-sd.png`
);

const imageGateway = imageIpfs.replace(
  "ipfs://",
  "https://gateway.pinata.cloud/ipfs/"
);

// 3. Build metadata
const metadata = {
  name: `${name} – Powerlist 2026`,
  description: `Official Women in FinTech Powerlist 2026 digital ticket for ${name}.`,
  image: imageIpfs,
  external_url: "https://powerlist-nine.vercel.app",
  attributes: [
    { trait_type: "Event", value: "Powerlist 2026" },
    { trait_type: "Name", value: name },
    { trait_type: "Type", value: "Digital Ticket" },
    { trait_type: "Network", value: "Avalanche Fuji" },
  ],
};

const tokenURI = await uploadJSONToPinata(metadata);

// 4. Mint (same as before)
const txHash = await walletClient.writeContract({
  address: CONTRACT_ADDRESS,
  abi,
  functionName: "mintTo",
  args: [wallet as `0x${string}`, name, tokenURI, hash],
});