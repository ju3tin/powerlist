import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Profile from "@/models/Profile";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    await connectDB();

    // Basic validation
    if (!body.id) {
      return NextResponse.json(
        { error: "Profile ID is required" },
        { status: 400 }
      );
    }

    if (!body.title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!body.slug) {
      return NextResponse.json(
        { error: "Slug is required" },
        { status: 400 }
      );
    }

    // Check duplicate ID
    const existingId = await Profile.findOne({
      id: Number(body.id),
    });

    if (existingId) {
      return NextResponse.json(
        { error: `Profile ID ${body.id} already exists` },
        { status: 409 }
      );
    }

    // Check duplicate slug
    const existingSlug = await Profile.findOne({
      slug: body.slug,
    });

    if (existingSlug) {
      return NextResponse.json(
        { error: `Slug "${body.slug}" already exists` },
        { status: 409 }
      );
    }

    const profile = await Profile.create({
      id: Number(body.id),
      title: body.title,
      artist_title: body.artist_title || "",
      date: body.date || "",
      content: body.content || "",
      slug: body.slug,
      featured_image: body.featured_image || "",
      power_list_category: body.power_list_category || "",
      link: body.link || "",
      social_icons: body.social_icons || [],
      count: body.count || "",
      company_logo: body.company_logo || "",
      full_slug: body.full_slug || "",
    });

    return NextResponse.json(
      {
        success: true,
        profile,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create profile error:", error);

    return NextResponse.json(
      {
        error: error.message || "Failed to create profile",
      },
      { status: 500 }
    );
  }
}