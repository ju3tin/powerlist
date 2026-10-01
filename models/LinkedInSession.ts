import mongoose, { Schema, models } from "mongoose";

const LinkedInSessionSchema = new Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    linkedinSub: {
      type: String,
      required: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    name: {
      type: String,
    },

    firstName: {
      type: String,
    },

    lastName: {
      type: String,
    },

    picture: {
      type: String,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// MongoDB automatically removes expired sessions.
LinkedInSessionSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

export default
  models.LinkedInSession ||
  mongoose.model(
    "LinkedInSession",
    LinkedInSessionSchema
  );