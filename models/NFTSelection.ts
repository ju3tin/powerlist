
import mongoose, { Schema, models, model } from "mongoose";

const NFTSelectionSchema = new Schema(
  {
    profileId: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    jobTitle: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "",
    },
    imageUrl: {
      type: String,
      default: "",
    },
    companyLogo: {
      type: String,
      default: "",
    },
    linkedinUrl: {
      type: String,
      default: "",
    },
    wallet: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },
    tokenId: {
      type: String,
      default: "",
    },
    year: {
      type: Number,
      required: true,
      default: 2026,
    },
    ticketConfig: {
      type: Schema.Types.Mixed,
      default: {},
    },

    // Recipient checkbox
    recipientSelected: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["selected", "approved", "removed"],
      default: "selected",
    },

    // Independent of recipient selection
    mintStatus: {
      type: String,
      enum: ["not_minted", "pending", "minted", "failed"],
      default: "not_minted",
    },

    transactionHash: {
      type: String,
      default: "",
    },

    selectedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

NFTSelectionSchema.index(
  { profileId: 1, year: 1 },
  { unique: true }
);

const NFTSelection =
  models.NFTSelection ||
  model("NFTSelection", NFTSelectionSchema);

export default NFTSelection;
