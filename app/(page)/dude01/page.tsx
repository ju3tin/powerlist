"use client";

import { Suspense, FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LinkedInLoginButton from "@/components/LinkedInLoginButton1";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const isClaiming = searchParams.get("claim") === "true";
  const errorParam = searchParams.get("error");

  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [claimError, setClaimError] = useState("");
  const [loading, setLoading] = useState(false);

  function authenticationError() {
    switch (errorParam) {
      case "linkedin_auth_failed":
        return "LinkedIn authentication failed.";

      case "linkedin_failed":
        return "Unable to sign in with LinkedIn.";

      case "no_linkedin_email":
        return "LinkedIn did not provide an email address.";

      default:
        return "";
    }
  }

  async function handleClaim(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setClaimError("");

    if (!linkedinUrl.trim()) {
      setClaimError(
        "Please enter your LinkedIn profile URL."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/claimprofile",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            linkedinUrl: linkedinUrl.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setClaimError(
          data.error || "Unable to claim profile."
        );
        return;
      }

      router.push(
        `/profiles/${data.profile.slug}`
      );
    } catch (error) {
      console.error("Claim error:", error);

      setClaimError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (isClaiming) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-black">
              Claim your profile
            </h1>

            <p className="mt-3 text-gray-600">
              Your LinkedIn account has been authenticated.
            </p>

            <p className="mt-3 text-gray-600">
              We couldn't find your LinkedIn email on an
              existing Powerlist profile.
            </p>

            <p className="mt-3 text-gray-600">
              Enter the LinkedIn profile URL listed on
              your Powerlist profile to claim it.
            </p>
          </div>

          <form onSubmit={handleClaim}>
            <label
              htmlFor="linkedinUrl"
              className="mb-2 block font-medium text-black"
            >
              LinkedIn profile URL
            </label>

            <input
              id="linkedinUrl"
              type="url"
              value={linkedinUrl}
              onChange={(event) =>
                setLinkedinUrl(event.target.value)
              }
              placeholder="https://www.linkedin.com/in/your-name/"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black outline-none focus:border-[#0A66C2]"
              autoComplete="url"
            />

            {claimError && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {claimError}
              </div>
            )}

            <button
              type="submit"
              disabled={
                loading || !linkedinUrl.trim()
              }
              className="mt-5 w-full rounded-lg bg-[#0A66C2] px-6 py-3 font-semibold text-white transition hover:bg-[#004182] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Checking profile..."
                : "Claim profile"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className="mt-5 w-full text-sm text-gray-500 hover:text-black"
          >
            Back to login
          </button>
        </div>
      </main>
    );
  }

  const authError = authenticationError();

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-black">
            Sign in
          </h1>

          <p className="mt-3 text-gray-600">
            Sign in with LinkedIn to access your Powerlist profile.
          </p>
        </div>

        {authError && (
          <div className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-600">
            {authError}
          </div>
        )}

        <LinkedInLoginButton
          text="Continue with LinkedIn"
        />

        <p className="mt-6 text-center text-xs text-gray-500">
          If your profile hasn't been claimed yet,
          we'll help you claim it after you sign in with LinkedIn.
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-gray-600">
            Loading...
          </div>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}