import mongoose, { Schema, models } from "mongoose";

const SocialIconSchema = new Schema(
  {
    icon_type: String,
    social_network_url: String,
  },
  { _id: false }
);

const OtherSchema = new Schema(
  {
    other_type: String,
    other_type_value: String,
  },
  { _id: false }
);

const ProfileSchema = new Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
    },

    title: {
      type: String,
      required: true,
    },

    email: {
      type: String,
    },

    artist_title: String,

    date: String,

    content: String,

    slug: {
      type: String,
      required: true,
      unique: true,
    },

    featured_image: String,

    power_list_category: String,

    link: String,

    social_icons: [SocialIconSchema],

    other: [OtherSchema],

    count: String,

    company_logo: String,

    full_slug: String,
  },
  {
    timestamps: true,
  }
);

export default models.Profile ||
  mongoose.model("Profile", ProfileSchema);
