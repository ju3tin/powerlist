
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import NFTSelection from "@/models/NFTSelection";

export const runtime = "nodejs";

function isValidWallet(wallet: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(wallet);
}

// GET /api/nft-selections
// GET /api/nft-selections?year=2026
// GET /api/nft-selections?year=2026&recipientSelected=true
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const yearParam = request.nextUrl.searchParams.get("year");
    const recipientParam =
      request.nextUrl.searchParams.get("recipientSelected");

    const filter: Record<string, unknown> = {};

    if (yearParam) {
      const year = Number(yearParam);

      if (!Number.isInteger(year) || year < 2000 || year > 2100) {
        return NextResponse.json(
          { success: false, error: "Invalid year." },
          { status: 400 }
        );
      }

      filter.year = year;
    }

    if (recipientParam === "true") {
      filter.recipientSelected = true;
    } else if (recipientParam === "false") {
      filter.recipientSelected = false;
    }

    const selections = await NFTSelection.find(filter)
      .sort({ selectedAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: selections.length,
      selections,
    });
  } catch (error) {
    console.error("GET NFT selections error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve NFT selections.",
      },
      { status: 500 }
    );
  }
}

// POST /api/nft-selections
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const {
      profileId,
      name,
      jobTitle = "",
      category = "",
      imageUrl = "",
      companyLogo = "",
      linkedinUrl = "",
      email = "",
      wallet = "",
      tokenId = "",
      year = 2026,
      ticketConfig = {},
      recipientSelected,
    } = body;

    // Profile ID and name are required.
    if (
      typeof profileId !== "string" ||
      !profileId.trim() ||
      typeof name !== "string" ||
      !name.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "profileId and name are required.",
        },
        { status: 400 }
      );
    }

    const numericYear = Number(year);

    if (
      !Number.isInteger(numericYear) ||
      numericYear < 2000 ||
      numericYear > 2100
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid year." },
        { status: 400 }
      );
    }

    // Wallet is optional, but must be valid if supplied.
    if (typeof wallet !== "string") {
      return NextResponse.json(
        { success: false, error: "Wallet must be a string." },
        { status: 400 }
      );
    }

    const trimmedWallet = wallet.trim();

    if (trimmedWallet && !isValidWallet(trimmedWallet)) {
      return NextResponse.json(
        { success: false, error: "Invalid wallet address." },
        { status: 400 }
      );
    }

    // Email is optional.
    if (typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Email must be a string." },
        { status: 400 }
      );
    }

    // Validate checkbox state when provided.
    if (
      recipientSelected !== undefined &&
      typeof recipientSelected !== "boolean"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "recipientSelected must be true or false.",
        },
        { status: 400 }
      );
    }

    const isSelected =
      typeof recipientSelected === "boolean"
        ? recipientSelected
        : true;

    const update: Record<string, unknown> = {
      name: name.trim(),
      jobTitle,
      category,
      imageUrl,
      companyLogo,
      linkedinUrl,
      status: isSelected ? "selected" : "removed",
    };

    // Only update the email when a non-empty email is supplied.
    // Otherwise, an existing email in MongoDB is preserved.
    if (email.trim()) {
      update.email = email.trim().toLowerCase();
    }

    // Only update the wallet when a non-empty wallet is supplied.
    // Otherwise, an existing wallet in MongoDB is preserved.
    if (trimmedWallet) {
      update.wallet = trimmedWallet.toLowerCase();
    }

    // Optional ticket fields.
    if (typeof tokenId === "string") {
      update.tokenId = tokenId;
    }

    if (
      ticketConfig !== null &&
      typeof ticketConfig === "object" &&
      !Array.isArray(ticketConfig)
    ) {
      update.ticketConfig = ticketConfig;
    }

    // Persist the selected/deselected checkbox state.
    if (typeof recipientSelected === "boolean") {
      update.recipientSelected = recipientSelected;
    }

    const selection = await NFTSelection.findOneAndUpdate(
      {
        profileId: profileId.trim(),
        year: numericYear,
      },
      {
        $set: update,
        $setOnInsert: {
          mintStatus: "not_minted",
          selectedAt: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return NextResponse.json({
      success: true,
      message: isSelected
        ? "NFT recipient selection saved successfully."
        : "NFT recipient removed successfully.",
      selection,
    });
  } catch (error) {
    console.error("POST NFT selections error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to save NFT selection.",
      },
      { status: 500 }
    );
  }
}
