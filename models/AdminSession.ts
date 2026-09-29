import mongoose, { Schema, models } from "mongoose";

const AdminSessionSchema = new Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    adminId: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
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

// MongoDB automatically removes expired sessions
AdminSessionSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

export default (
  models.AdminSession ||
  mongoose.model(
    "AdminSession",
    AdminSessionSchema
  )
);
