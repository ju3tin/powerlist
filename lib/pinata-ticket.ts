import { PinataSDK } from "pinata";
import { generateTicketImage } from "@/lib/ticket-image";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.PINATA_GATEWAY,
});

type UploadTicketParams = {
  name: string;
  tokenId?: string;
  imageUrl?: string;
};

export async function uploadTicketToPinata({
  name,
  tokenId = "001",
  imageUrl,
}: UploadTicketParams) {
  console.log("Generating ticket...");

  // Generate your PNG
  const buffer = await generateTicketImage({
    name,
    tokenId,
    imageUrl,
  });

  console.log(
    "Generated PNG:",
    buffer.length,
    "bytes"
  );

  // Buffer -> Uint8Array -> File
  const file = new File(
    [new Uint8Array(buffer)],
    `ticket-${tokenId}.png`,
    {
      type: "image/png",
    }
  );

  console.log("Uploading to PUBLIC Pinata IPFS...");

  // IMPORTANT:
  // .public means this is uploaded to Pinata's
  // public IPFS network.
  const upload = await pinata.upload.public.file(
    file,
    {
      metadata: {
        name: `Women in FinTech Powerlist 2026 - ${name}`,
        keyvalues: {
          tokenId,
          name,
          type: "ticket",
        },
      },
    }
  );

  console.log("Pinata upload response:", upload);

  if (!upload.cid) {
    throw new Error(
      "Pinata upload did not return a CID."
    );
  }

  console.log("CID:", upload.cid);

  return {
    cid: upload.cid,
    network: upload.network,
  };
}
