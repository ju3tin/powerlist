"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginContent() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const router = useRouter();

  const [hasLinkedInCookies, setHasLinkedInCookies] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  // Check for existing LinkedIn cookies
  useEffect(() => {
    const cookies = document.cookie;
    const hasCookies =
      cookies.includes("linkedin_sub") ||
      cookies.includes("linkedin_email") ||
      cookies.includes("linkedin_name");

    setHasLinkedInCookies(hasCookies);
    setChecking(false);
  }, []);

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/claim-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedinUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not claim profile");
        setLoading(false);
        return;
      }

      // Success
      router.push(data.redirectTo || "/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 text-center">
          {/* Brand */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 mb-4">
              <span className="text-2xl font-bold text-white">IF</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Innovate Finance
            </h1>
            <p className="text-blue-200 text-sm">Powerlist Digital Ticket</p>
          </div>

          {/* Error from Auth.js */}
          {errorParam && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/20 border border-red-500/40 text-red-200 text-sm">
              {errorParam === "OAuthAccountNotLinked"
                ? "This account is already linked to another user."
                : "Login failed. Please try again."}
            </div>
          )}

          {/* ========== CASE 1: Already have LinkedIn cookies → show Claim form ========== */}
          {hasLinkedInCookies ? (
            <>
              <p className="text-blue-200 text-sm mb-6">
                We detected your LinkedIn login.  
                Paste your LinkedIn profile URL to claim your Powerlist profile.
              </p>

              <form onSubmit={handleClaim} className="space-y-4 text-left">
                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-1">
                    Your LinkedIn URL
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://www.linkedin.com/in/yourname"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-blue-200/50 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-300 bg-red-500/20 border border-red-500/30 px-3 py-2 rounded">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition"
                >
                  {loading ? "Checking..." : "Claim Profile & Continue"}
                </button>
              </form>

              <p className="mt-6 text-xs text-blue-200/60">
                Example: https://www.linkedin.com/in/abbythomas/
              </p>
            </>
          ) : (
            /* ========== CASE 2: No cookies → normal LinkedIn button ========== */
            <>
              <button
                onClick={() => signIn("linkedin", { callbackUrl: "/login" })}
                className="w-full flex items-center justify-center gap-3 bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                Continue with LinkedIn
              </button>

              <p className="mt-6 text-xs text-blue-200/70">
                Only verified Powerlist members can access their digital ticket.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
      <LoginContent />
    </Suspense>
  );
}