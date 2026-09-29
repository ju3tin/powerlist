import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";
import AdminSession from "@/models/AdminSession";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        {
          error: "Email and password are required",
        },
        { status: 400 }
      );
    }

    const admin = await Admin.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isMatch =
      await admin.comparePassword(password);

    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate secure session token
    const token = crypto
      .randomBytes(32)
      .toString("hex");

    // Session lasts 24 hours
    const expiresAt = new Date(
      Date.now() +
        24 * 60 * 60 * 1000
    );

    await AdminSession.create({
      token,
      adminId: admin._id,
      expiresAt,
    });

    const response = NextResponse.json({
      success: true,

      admin: {
        id: admin._id.toString(),
        email: admin.email,
        name: admin.name,
      },
    });

    response.cookies.set({
      name: "admin_token",
      value: token,
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
