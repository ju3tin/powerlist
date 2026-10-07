import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb"; // your existing mongoose connection helper
import Profile from "@/models/Profile"; // adjust path if needed

const schema = z.object({
  title: z.string().min(2, "Title is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  artist_title: z.string().optional(),
  date: z.string().optional(),
  content: z.string().optional(),
  power_list_category: z.string().optional(),
  link: z.string().url().optional().or(z.literal("")),
  count: z.string().optional(),
  company_logo: z.string().optional(),
  featured_image: z.string().optional(),

  // Social icons (simple version – you can expand later)
  social_icons: z
    .array(
      z.object({
        icon_type: z.string(),
        social_network_url: z.string().url().or(z.literal("")),
      })
    )
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const data = schema.parse(body);

    // Generate a unique numeric id (you can change this logic)
    const lastProfile = await Profile.findOne().sort({ id: -1 }).lean();
    const nextId = lastProfile ? lastProfile.id + 1 : 1;

    // Generate slug from title
    const baseSlug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    let slug = baseSlug;
    let counter = 1;

    // Make sure slug is unique
    while (await Profile.exists({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const newProfile = await Profile.create({
      id: nextId,
      title: data.title,
      email: data.email || undefined,
      artist_title: data.artist_title || undefined,
      date: data.date || undefined,
      content: data.content || undefined,
      slug,
      full_slug: slug, // adjust if you have a different structure
      featured_image: data.featured_image || undefined,
      power_list_category: data.power_list_category || undefined,
      link: data.link || undefined,
      social_icons: data.social_icons || [],
      other: [
        {
          other_type: "Auth",
          other_type_value: "none", // ← exactly as you requested
        },
      ],
      count: data.count || undefined,
      company_logo: data.company_logo || undefined,
    });

    return NextResponse.json({ success: true, id: newProfile.id });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    // Handle duplicate key errors nicely
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A profile with this title or email already exists." },
        { status: 409 }
      );
    }

    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}