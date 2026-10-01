
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Admin";

  if (!email || !password || password.length < 12) {
    throw new Error(
      "Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters)"
    );
  }

  await connectDB();

  const existing = await Admin.findOne({ email });

  if (existing) {
    console.log("Admin already exists. No changes made.");
    return;
  }

  // Hash once, then save without invoking the password hashing hook again.
  const hashedPassword = await bcrypt.hash(password, 12);

  const admin = new Admin({
    email,
    password: hashedPassword,
    name,
  });

  // The pre-save hook would hash again, so mark this field unmodified.
  admin.$ignore("password");
  await admin.save();

  console.log(`Admin created: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });