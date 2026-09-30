import mongoose, { Schema, models, model } from "mongoose";

export type TicketConfigData = {
  eventLabel?: string;
  title?: string;
  year?: string;
  badgeText?: string;
  brandName?: string;
  brandInitials?: string;
  networkText?: string;
  issuedToLabel?: string;
  bgGradient?: string;
  accentFrom?: string;
  accentTo?: string;
  accentText?: string;
  mutedText?: string;
  badgeBorder?: string;
  avatarBorder?: string;
  titleSize?: number;
  nameSize?: number;
};

const TicketConfigSchema = new Schema(
  {
    // Single active config (you can add versioning later)
    key: { type: String, default: "default", unique: true },
    config: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

export const TicketConfigModel =
  models.TicketConfig || model("TicketConfig", TicketConfigSchema);


/**
 * 
import mongoose, { Schema, models, model } from "mongoose";

const TicketConfigSchema = new Schema(
  {
    key: { type: String, default: "default", unique: true },
    config: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

export const TicketConfigModel =
  models.TicketConfig || model("TicketConfig", TicketConfigSchema);
 * 
 */