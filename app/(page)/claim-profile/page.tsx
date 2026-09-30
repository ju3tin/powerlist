"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ClaimProfilePage() {
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

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

      // Success
      router.push(data.redirectTo || "/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Claim your Powerlist profile
        </h1>
        <p className="text-gray-600 mb-6">
          LinkedIn did not share your email.  
          Paste your LinkedIn profile URL so we can match you and create an account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your LinkedIn URL
            </label>
            <input
              type="url"
              required
              placeholder="https://www.linkedin.com/in/yourname"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
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

        <p className="mt-6 text-xs text-gray-500 text-center">
          Example: https://www.linkedin.com/in/abbythomas/
        </p>
      </div>
    </div>
  );
}