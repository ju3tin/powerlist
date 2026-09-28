export async function uploadJSONToPinata(data: Record<string, any>) {
    const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataContent: data,
        pinataMetadata: {
          name: data.name || "NFT Metadata",
        },
      }),
    });
  
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Pinata JSON upload failed: ${err}`);
    }
  
    const json = await res.json();
    return `ipfs://${json.IpfsHash}`;
  }
  
  export async function uploadBufferToPinata(
    buffer: Buffer,
    fileName: string
  ) {
    // Convert Buffer → Uint8Array (fixes the BlobPart type error)
    const bytes = new Uint8Array(buffer);
  
    const formData = new FormData();
    const blob = new Blob([bytes], { type: "image/png" });
    formData.append("file", blob, fileName);
  
    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: formData,
    });
  
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Pinata file upload failed: ${err}`);
    }
  
    const json = await res.json();
    return `ipfs://${json.IpfsHash}`;
  }