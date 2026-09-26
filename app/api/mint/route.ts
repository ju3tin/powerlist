import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ethers } from "ethers";
import { PinataSDK } from "pinata";
import axios from "axios";

const pinata = new PinataSDK({ pinataJwt: process.env.PINATA_JWT! });

// Fuji Testnet
const provider = new ethers.JsonRpcProvider(
  process.env.RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc"
);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

const abi = [
  "function mintTo(address to, string name, string tokenURI, string hash) external returns (uint256)",
  "function isHashUsed(string hash) view returns (bool)",
  "function hasNFT(address account) view returns (bool)",
  "function remainingSupply() view returns (uint256)",
];

const contract = new ethers.Contract(
  process.env.NFT_CONTRACT_ADDRESS!,
  abi,
  wallet
);

function cleanLinkedInUrl(url: string) {
  if (!url) return "";
  return url.toLowerCase().replace(/\/$/, "").split("?")[0];
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.linkedinUrl) {
      return NextResponse.json(
        { error: "Not authenticated with LinkedIn" },
        { status: 401 }
      );
    }

    const { wallet: userWallet } = await req.json();
    if (!userWallet || !ethers.isAddress(userWallet)) {
      return NextResponse.json(
        { error: "Valid wallet address required" },
        { status: 400 }
      );
    }

    // Fetch people from Innovate Finance API
    const apiRes = await axios.get(process.env.INNOVATE_API_URL!);
    const people = apiRes.data.data || apiRes.data;

    const cleanUserLinkedIn = cleanLinkedInUrl(session.linkedinUrl);

    const person = people.find((p: any) => {
      if (!p.social_icons) return false;
      return p.social_icons.some((icon: any) => {
        if (icon.icon_type !== "linkedin") return false;
        return cleanLinkedInUrl(icon.social_network_url) === cleanUserLinkedIn;
      });
    });

    if (!person) {
      return NextResponse.json(
        { error: "No matching profile found for your LinkedIn account" },
        { status: 404 }
      );
    }

    const name = person.title;
    const hash = person.id.toString();
    const imageUrl = person.featured_image;

    // Safety checks
    if (await contract.isHashUsed(hash)) {
      return NextResponse.json(
        { error: "This profile NFT has already been claimed" },
        { status: 400 }
      );
    }
    if (await contract.hasNFT(userWallet)) {
      return NextResponse.json(
        { error: "This wallet already has an NFT" },
        { status: 400 }
      );
    }
    if ((await contract.remainingSupply()) === 0n) {
      return NextResponse.json(
        { error: "All 200 NFTs have been minted" },
        { status: 400 }
      );
    }

    // Upload image to Pinata
    const imageResponse = await axios.get(imageUrl, {
      responseType: "arraybuffer",
    });
    const imageBuffer = Buffer.from(imageResponse.data);
    const imageFile = new File([imageBuffer], `${hash}.jpg`, {
      type: "image/jpeg",
    });
    const imageUpload = await pinata.upload.file(imageFile);
    const imageCid = imageUpload.cid;

    // Create metadata
    const metadata = {
      name,
      description: person.content
        ? person.content.replace(/<[^>]*>/g, "").slice(0, 400)
        : `${name} - Official Profile NFT`,
      image: `ipfs://${imageCid}`,
      attributes: [
        { trait_type: "Hash", value: hash },
        { trait_type: "Role", value: person.artist_title || "Member" },
        { trait_type: "Date", value: person.date || "" },
        { trait_type: "Profile", value: person.link || "" },
      ],
      external_url: person.link || "",
    };

    const metadataUpload = await pinata.upload.json(metadata);
    const tokenURI = `ipfs://${metadataUpload.cid}`;

    // Mint on Fuji
    const tx = await contract.mintTo(userWallet, name, tokenURI, hash);
    await tx.wait();

    return NextResponse.json({
      success: true,
      txHash: tx.hash,
      name,
      hash,
      tokenURI,
      image: `https://gateway.pinata.cloud/ipfs/${imageCid}`,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || "Mint failed" },
      { status: 500 }
    );
  }
}
