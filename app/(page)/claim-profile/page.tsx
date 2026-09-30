"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function ClaimProfilePage() {
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    // Already has email → no need to claim
    if (status === "authenticated" && session?.user?.email) {
      router.push("/");
    }
  }, [status, session, router]);

  async function handleSubmit(e: React.FormEvent) {
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

      router.push(data.redirectTo || "/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-2">
          Claim your Powerlist profile
        </h1>
        <p className="text-blue-200 mb-6 text-sm">
          LinkedIn did not share your email. Paste your LinkedIn profile URL so
          we can match you and create an account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-blue-200/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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

        <p className="mt-6 text-xs text-blue-200/60 text-center">
          Example: https://www.linkedin.com/in/abbythomas/
        </p>
      </div>
    </div>
  );
}