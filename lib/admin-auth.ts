
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";

const COOKIE_NAME = "admin_token";

function getSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be configured with a strong secret");
  }

  return new TextEncoder().encode(secret);
}

export async function createAdminToken(adminId: string) {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(adminId)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecret());
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });

    if (payload.role !== "admin" || !payload.sub) return null;

    await connectDB();

    const admin = await Admin.findById(payload.sub)
      .select("_id email name")
      .lean();

    if (!admin) return null;

    return {
      id: String(admin._id),
      email: admin.email,
      name: admin.name,
    };
  } catch {
    return null;
  }
}

export { COOKIE_NAME };