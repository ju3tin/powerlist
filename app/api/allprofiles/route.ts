import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Profile from "@/models/Profile";

export async function GET() {
  try {
    await connectDB();

    // Explicitly get every document, sorted by title
    const profiles = await Profile.find({})
      .sort({ title: 1 })
      .lean()
      .exec();

    // Guarantee we always return an array
    return NextResponse.json(Array.isArray(profiles) ? profiles : []);
  } catch (error: any) {
    console.error("GET /api/profiles error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch profiles" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { _id, ...updates } = body;

    if (!_id) {
      return NextResponse.json({ error: "_id is required" }, { status: 400 });
    }

    const profile = await Profile.findByIdAndUpdate(_id, updates, {
      new: true,
      runValidators: true,
    }).lean();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error: any) {
    console.error("PATCH /api/profiles error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}