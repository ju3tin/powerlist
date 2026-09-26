import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Profile from "@/models/Profile";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;

    // Try to find by MongoDB _id, original id, or slug
    let profile = null;

    // Check if it's a valid MongoDB ObjectId
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      profile = await Profile.findById(id).lean();
    }

    // Try original numeric id
    if (!profile && !isNaN(Number(id))) {
      profile = await Profile.findOne({ id: Number(id) }).lean();
    }

    // Try by slug
    if (!profile) {
      profile = await Profile.findOne({ slug: id }).lean();
    }

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}