import { connectDB } from "@/lib/mongodb";
import { TicketConfigModel } from "@/models/TicketConfig";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    const doc = await TicketConfigModel.findOne({ key: "default" }).lean();
    return NextResponse.json({
      success: true,
      config: doc?.config ?? null,
      updatedAt: doc?.updatedAt ?? null,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { config } = body;

    if (!config || typeof config !== "object") {
      return NextResponse.json(
        { success: false, error: "config object is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(config.layers) || !config.background) {
      return NextResponse.json(
        {
          success: false,
          error: "config must include layers[] and background",
        },
        { status: 400 }
      );
    }

    const doc = await TicketConfigModel.findOneAndUpdate(
      { key: "default" },
      { $set: { config } },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      config: doc.config,
      updatedAt: doc.updatedAt,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}