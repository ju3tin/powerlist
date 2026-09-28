import { PinataSDK } from "pinata";
import { generateTicketImage } from "@/lib/generateTicket";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.PINATA_GATEWAY,
});

export async function generateAndUploadTicket({
  name,
  tokenId = "001",
  imageUrl,
}: {
  name: string;
  tokenId?: string;
  imageUrl?: string;
}) {
  // 1. Generate the ticket image
  const buffer = await generateTicketImage({
    name,
    tokenId,
    imageUrl,
  });

  // 2. Convert Buffer → Uint8Array → File
  const file = new File(
    [new Uint8Array(buffer)],
    `ticket-${tokenId}.png`,
    {
      type: "image/png",
    }
  );

  // 3. Upload to Pinata
  const upload = await pinata.upload.public.file(file, {
    metadata: {
      name: `Women in FinTech Powerlist 2026 – ${name}`,
      keyvalues: {
        tokenId,
        name,
        type: "ticket",
      },
    },
  });

  // 4. Return the CID and gateway URL
  return {
    cid: upload.cid,
    url: `https://gateway.pinata.cloud/ipfs/${upload.cid}`,
    upload,
  };
}