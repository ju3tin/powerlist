import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import NFTSelection from "@/models/NFTSelection";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profiles, recipientSelected, status } = body;

    if (!Array.isArray(profiles) || profiles.length === 0) {
      return NextResponse.json(
        { error: "profiles array is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Build bulk operations
    const operations = profiles.map((profile: any) => ({
      updateOne: {
        filter: {
          profileId: profile.profileId,
          year: profile.year || 2026,
        },
        update: {
          $set: {
            name: profile.name || "Untitled profile",
            jobTitle: profile.jobTitle || "",
            category: profile.category || "",
            imageUrl: profile.imageUrl || "",
            companyLogo: profile.companyLogo || "",
            linkedinUrl: profile.linkedinUrl || "",
            wallet: profile.wallet || "",
            recipientSelected: recipientSelected,
            status: status, // "selected" or "removed"
            mintStatus: profile.mintStatus || "not_minted",
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
            // any other defaults you want only on first insert
          },
        },
        upsert: true,
      },
    }));

    // Execute bulk write
    const result = await NFTSelection.bulkWrite(operations, {
      ordered: false, // continue even if some fail
    });

    return NextResponse.json({
      success: true,
      matched: result.matchedCount,
      modified: result.modifiedCount,
      upserted: result.upsertedCount,
    });
  } catch (error: any) {
    console.error("Bulk update error:", error);
    return NextResponse.json(
      { error: error.message || "Bulk update failed" },
      { status: 500 }
    );
  }
}