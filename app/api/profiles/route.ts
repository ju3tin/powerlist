import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Profile from "@/models/Profile";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const page = parseInt(searchParams.get("page") || "1");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const filter: any = {};

    if (category) {
      filter.power_list_category = category;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { artist_title: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [profiles, total] = await Promise.all([
      Profile.find(filter)
        .sort({ title: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Profile.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: profiles,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Keep the existing PATCH for the admin editor
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const { _id, ...updates } = await req.json();

    if (!_id) {
      return NextResponse.json({ error: "_id is required" }, { status: 400 });
    }

    const profile = await Profile.findByIdAndUpdate(_id, updates, {
      new: true,
      runValidators: true,
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}