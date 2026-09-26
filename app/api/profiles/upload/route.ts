import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Profile from "@/models/Profile";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const profiles = Array.isArray(body) ? body : body.profiles || body.data || [];

    if (!Array.isArray(profiles) || profiles.length === 0) {
      return NextResponse.json({ error: "No profiles found in JSON" }, { status: 400 });
    }

    const operations = profiles.map((p: any) => ({
      updateOne: {
        filter: { id: p.id },
        update: { $set: p },
        upsert: true,
      },
    }));

    const result = await Profile.bulkWrite(operations);

    return NextResponse.json({
      success: true,
      upserted: result.upsertedCount,
      modified: result.modifiedCount,
      total: profiles.length,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
