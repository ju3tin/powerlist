import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import crypto from "crypto";

import { connectDB } from "@/lib/mongodb";
import Profile from "@/models/Profile";
import LinkedInSession from "@/models/LinkedInSession";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  /*
   * ------------------------------------------------
   * Check LinkedIn OAuth response
   * ------------------------------------------------
   */

  if (error || !code) {
    console.error("LinkedIn OAuth error:", error);

    return NextResponse.redirect(
      new URL(
        "/?error=linkedin_auth_failed",
        req.url
      )
    );
  }

  try {
    const clientId = process.env.AUTH_LINKEDIN_ID;
    const clientSecret =
      process.env.AUTH_LINKEDIN_SECRET;
    const redirectUri =
      process.env.LINKEDIN_REDIRECT_URI;

    if (!clientId) {
      throw new Error(
        "AUTH_LINKEDIN_ID is not configured"
      );
    }

    if (!clientSecret) {
      throw new Error(
        "AUTH_LINKEDIN_SECRET is not configured"
      );
    }

    if (!redirectUri) {
      throw new Error(
        "LINKEDIN_REDIRECT_URI is not configured"
      );
    }

    /*
     * ------------------------------------------------
     * Exchange LinkedIn authorization code
     * for an access token
     * ------------------------------------------------
     */

    const tokenRes = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
      {
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken =
      tokenRes.data.access_token;

    if (!accessToken) {
      throw new Error(
        "LinkedIn did not return an access token"
      );
    }

    /*
     * ------------------------------------------------
     * Get authenticated LinkedIn user
     * ------------------------------------------------
     */

    const profileRes = await axios.get(
      "https://api.linkedin.com/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const linkedin = profileRes.data;

    console.log(
      "LinkedIn profile:",
      linkedin
    );

    /*
     * LinkedIn "sub" is the unique identifier
     * for the authenticated LinkedIn user.
     */

    if (!linkedin.sub) {
      throw new Error(
        "LinkedIn did not return a user ID"
      );
    }

    /*
     * We require the LinkedIn email because
     * this is what we use to find an existing
     * Powerlist profile.
     */

    if (!linkedin.email) {
      return NextResponse.redirect(
        new URL(
          "/?error=no_linkedin_email",
          req.url
        )
      );
    }

    const email = linkedin.email
      .trim()
      .toLowerCase();

    /*
     * ------------------------------------------------
     * Connect to MongoDB
     * ------------------------------------------------
     */

    await connectDB();

    /*
     * ------------------------------------------------
     * Find existing Powerlist profile
     * ------------------------------------------------
     *
     * This is ONLY used to decide where to
     * redirect the user.
     *
     * It is NOT the authentication mechanism.
     */

    const profile =
      await Profile.findOne({
        email,
      }).lean();

    /*
     * ------------------------------------------------
     * Create secure random session ID
     * ------------------------------------------------
     */

    const sessionId =
      crypto.randomBytes(32).toString("hex");

    /*
     * Session lasts 7 days.
     */

    const expiresAt = new Date(
      Date.now() +
        7 * 24 * 60 * 60 * 1000
    );

    /*
     * ------------------------------------------------
     * Store the authentication session in MongoDB
     * ------------------------------------------------
     *
     * The browser will NEVER receive the email
     * as its authentication credential.
     *
     * The browser only gets sessionId.
     */

    await LinkedInSession.create({
      sessionId,

      linkedinSub:
        linkedin.sub,

      email,

      name:
        linkedin.name || "",

      firstName:
        linkedin.given_name || "",

      lastName:
        linkedin.family_name || "",

      picture:
        linkedin.picture || "",

      expiresAt,
    });

    /*
     * ------------------------------------------------
     * Decide where the user should go
     * ------------------------------------------------
     *
     * Existing profile:
     *
     *   /profiles/profile-slug
     *
     * No existing profile:
     *
     *   /?claim=true
     *
     * The claim overlay on the homepage can then
     * ask for the LinkedIn profile URL.
     */

    const destination = profile
      ? `/profiles/${profile.slug}`
      : "/?claim=true";

    /*
     * ------------------------------------------------
     * Create redirect response
     * ------------------------------------------------
     */

    const response =
      NextResponse.redirect(
        new URL(
          destination,
          req.url
        )
      );

    /*
     * ------------------------------------------------
     * Set secure HTTP-only session cookie
     * ------------------------------------------------
     */

    response.cookies.set(
      "linkedin_session",
      sessionId,
      {
        httpOnly: true,

        secure:
          process.env.NODE_ENV ===
          "production",

        sameSite: "lax",

        maxAge:
          7 * 24 * 60 * 60,

        path: "/",
      }
    );

    /*
     * ------------------------------------------------
     * Remove the old email-based authentication
     * cookies if they still exist.
     * ------------------------------------------------
     */
/*
    response.cookies.delete(
      "linkedin_email"
    );

    response.cookies.delete(
      "linkedin_sub"
    );

    response.cookies.delete(
      "linkedin_name"
    );
*/
    response.cookies.delete(
      "linkedin_picture"
    );
/*
    response.cookies.delete(
      "linkedin_first_name"
    );

    response.cookies.delete(
      "linkedin_last_name"
    );
*/
    /*
     * ------------------------------------------------
     * Send user to the appropriate page
     * ------------------------------------------------
     */

    return response;
  } catch (error: any) {
    console.error(
      "LinkedIn callback error:",
      error.response?.data ||
        error.message ||
        error
    );

    return NextResponse.redirect(
      new URL(
        "/?error=linkedin_failed",
        req.url
      )
    );
  }
}