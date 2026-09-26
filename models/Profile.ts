import mongoose, { Schema, models } from "mongoose";

const SocialIconSchema = new Schema(
  {
    icon_type: String,
    social_network_url: String,
  },
  { _id: false }
);

const ProfileSchema = new Schema(
  {
    id: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    artist_title: String,
    date: String,
    content: String,
    slug: { type: String, required: true, unique: true },
    featured_image: String,
    power_list_category: String,
    link: String,
    social_icons: [SocialIconSchema],
    count: String,
    company_logo: String,
    full_slug: String,
  },
  { timestamps: true }
);

export default models.Profile || mongoose.model("Profile", ProfileSchema);
