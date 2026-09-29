import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AdminSession from "@/models/AdminSession";

export async function GET(req: NextRequest) {
  try {
    const token =
      req.cookies.get("admin_token")?.value;

    if (token) {
      await connectDB();

      await AdminSession.deleteOne({
        token,
      });
    }

    const response = NextResponse.redirect(
      new URL("/login", req.url)
    );

    response.cookies.set({
      name: "admin_token",
      value: "",
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);

    const response = NextResponse.redirect(
      new URL("/login", req.url)
    );

    response.cookies.set({
      name: "admin_token",
      value: "",
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  }
}
