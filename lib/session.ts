import { cookies } from "next/headers"
import { jwtVerify } from "jose"

const secret = new TextEncoder().encode(process.env.SESSION_SECRET!)

export async function getSession() {
  const token = (await cookies()).get("session")?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as {
      id: string
      name: string
      email: string
      image?: string
    }
  } catch {
    return null
  }
}