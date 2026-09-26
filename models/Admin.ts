import mongoose, { Schema, models } from "mongoose";
import bcrypt from "bcryptjs";

const AdminSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, default: "Admin" },
  },
  { timestamps: true }
);

// Hash password before saving
AdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Helper method to compare password
AdminSchema.methods.comparePassword = async function (candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default models.Admin || mongoose.model("Admin", AdminSchema);
