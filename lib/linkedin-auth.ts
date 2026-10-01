import { cookies } from "next/headers";

import { connectDB } from "@/lib/mongodb";
import LinkedInSession from "@/models/LinkedInSession";
import Profile from "@/models/Profile";

export async function getLinkedInSession() {
  const cookieStore = await cookies();

  const sessionId =
    cookieStore.get(
      "linkedin_session"
    )?.value;

  if (!sessionId) {
    return null;
  }

  await connectDB();

  const session =
    await LinkedInSession.findOne({
      sessionId,
      expiresAt: {
        $gt: new Date(),
      },
    }).lean();

  if (!session) {
    return null;
  }

  return session;
}

export async function getAuthenticatedProfile() {
  const session =
    await getLinkedInSession();

  if (!session) {
    return null;
  }

  await connectDB();

  const profile =
    await Profile.findOne({
      email: session.email,
    }).lean();

  if (!profile) {
    return null;
  }

  return {
    session,
    profile,
  };
}