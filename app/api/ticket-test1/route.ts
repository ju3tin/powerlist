import { NextResponse } from "next/server";
import { uploadTicketToPinata } from "@/lib/pinata-ticket";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } =
      new URL(request.url);

    const name =
      searchParams.get("name");

    const tokenId =
      searchParams.get("tokenId") || "001";

    const imageUrl =
      searchParams.get("imageUrl") ||
      undefined;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: "Name is required.",
        },
        {
          status: 400,
        }
      );
    }

    console.log(
      "GET /api/ticket-test"
    );

    const result =
      await uploadTicketToPinata({
        name,
        tokenId,
        imageUrl,
      });

    const cid = result.cid;

    /*
     * Use the standard Pinata gateway
     * for this test.
     */
    const url =
      `https://gateway.pinata.cloud/ipfs/${cid}`;

    console.log(
      "Ticket uploaded successfully."
    );

    console.log(
      "CID:",
      cid
    );

    console.log(
      "URL:",
      url
    );

    return NextResponse.json({
      success: true,
      cid,
      url,
    });
  } catch (error) {
    console.error(
      "TICKET TEST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown server error.",
      },
      {
        status: 500,
      }
    );
  }
}
