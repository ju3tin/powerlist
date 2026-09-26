import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";

export async function POST() {
  try {
    await connectDB();

    const existing = await Admin.findOne();
    if (existing) {
      return NextResponse.json({ message: "Admin already exists" });
    }

    const admin = await Admin.create({
      email: "admin@example.com",
      password: "admin123",
      name: "Main Admin",
    });

    return NextResponse.json({
      success: true,
      message: "Admin created successfully",
      email: admin.email,
      note: "Please change the password after first login and delete this seed route.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
