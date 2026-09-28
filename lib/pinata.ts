export async function uploadJSONToPinata(data: object) {
    const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataContent: data,
        pinataMetadata: { name: "NFT Metadata" },
      }),
    });
  
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Pinata JSON upload failed: ${err}`);
    }
  
    const json = await res.json();
    return `ipfs://${json.IpfsHash}`;
  }
  
  export async function uploadImageToPinata(
    imageUrl: string,
    fileName = "nft-image.png"
  ) {
    // Fetch the image (LinkedIn photo or generated)
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) throw new Error("Failed to fetch image");
  
    const blob = await imageRes.blob();
    const formData = new FormData();
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
      throw new Error(`Pinata image upload failed: ${err}`);
    }
  
    const json = await res.json();
    return `ipfs://${json.IpfsHash}`;
  }