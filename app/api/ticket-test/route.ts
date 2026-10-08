import { NextRequest, NextResponse } from "next/server";
import { generateTicketImage } from "@/lib/generateTicket";

export const runtime = "nodejs";

/*
 * ─────────────────────────────────────────────
 * GET
 *
 * Generates the ticket image only.
 *
 * NO PINATA
 * NO IPFS
 * NO MINT
 * ─────────────────────────────────────────────
 */
export async function GET(
  request: NextRequest
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const name =
      searchParams.get("name")?.trim();

    const tokenId =
      searchParams.get("tokenId")?.trim() ||
      "001";

    const imageUrl =
      searchParams.get("imageUrl")?.trim() ||
      undefined;

    if (!name) {
      return NextResponse.json(
        {
          error: "Name is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * This calls your existing generator.
     *
     * It returns a PNG Buffer.
     *
     * Nothing is uploaded anywhere.
     */
    const imageBuffer =
      await generateTicketImage({
        name,
        tokenId,
        imageUrl,
      });

    return new NextResponse(
      new Uint8Array(imageBuffer),
      {
        status: 200,
        headers: {
          "Content-Type": "image/png",

          /*
           * Browser can display/cache the image,
           * but we're deliberately preventing
           * long-term caching during testing.
           */
          "Cache-Control":
            "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error(
      "TICKET PREVIEW ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate ticket.",
      },
      {
        status: 500,
      }
    );
  }
}


/*
 * ─────────────────────────────────────────────
 * POST
 *
 * Uploads the APPROVED ticket to IPFS.
 *
 * The frontend sends the exact PNG that was
 * generated for the preview.
 * ─────────────────────────────────────────────
 */
export async function POST(
  request: NextRequest
) {
  try {
    const formData =
      await request.formData();

    const action =
      formData.get("action");

    const name =
      formData.get("name");

    const tokenId =
      formData.get("tokenId");

    const file =
      formData.get("file");

    if (action !== "upload") {
      return NextResponse.json(
        {
          error:
            "Invalid action.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      typeof tokenId !== "string" ||
      !tokenId.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Token ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error:
            "Approved ticket image is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Make sure we're actually receiving
     * the PNG produced by the preview step.
     */
    if (
      file.type !== "image/png"
    ) {
      return NextResponse.json(
        {
          error:
            "Ticket must be a PNG image.",
        },
        {
          status: 400,
        }
      );
    }

    const imageBuffer =
      Buffer.from(
        await file.arrayBuffer()
      );

    /*
     * ─────────────────────────────────────
     * PINATA UPLOAD
     * ─────────────────────────────────────
     *
     * Put your existing Pinata upload
     * implementation here.
     *
     * The important difference is:
     *
     * WE ARE NOT REGENERATING THE IMAGE.
     *
     * This is the exact PNG the user
     * approved in the preview.
     */

    const blob = new Blob(
      [imageBuffer],
      {
        type: "image/png",
      }
    );

    const uploadForm =
      new FormData();

    uploadForm.append(
      "file",
      blob,
      `ticket-${tokenId}.png`
    );

    /*
     * Replace this with your existing
     * Pinata endpoint/authentication.
     *
     * Example if using Pinata's API:
     */

    const pinataResponse =
      await fetch(
        "https://uploads.pinata.cloud/v3/files",
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${process.env.PINATA_JWT}`,
          },
          body: uploadForm,
        }
      );

    if (!pinataResponse.ok) {
      const errorText =
        await pinataResponse.text();

      console.error(
        "PINATA ERROR:",
        errorText
      );

      throw new Error(
        "Pinata upload failed."
      );
    }

    const pinataData =
      await pinataResponse.json();

    /*
     * Pinata's response can differ depending
     * on the API version you're using.
     *
     * Keep the CID extraction aligned with
     * your existing implementation if it
     * already works.
     */
    const cid =
      pinataData?.data?.cid ||
      pinataData?.IpfsHash ||
      pinataData?.cid;

    if (!cid) {
      console.error(
        "Unexpected Pinata response:",
        pinataData
      );

      throw new Error(
        "Pinata did not return a CID."
      );
    }

    const url =
      `https://gateway.pinata.cloud/ipfs/${cid}`;

    return NextResponse.json({
      success: true,
      cid,
      url,
    });
  } catch (error) {
    console.error(
      "TICKET IPFS UPLOAD ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to upload ticket to IPFS.",
      },
      {
        status: 500,
      }
    );
  }
}
