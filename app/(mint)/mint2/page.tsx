"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useState } from "react";

export default function Home() {
  const { data: session, status } = useSession();

  const { address, isConnected } = useAccount();

  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verifiedPerson, setVerifiedPerson] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  // ─────────────────────────────────────────────
  // Verify LinkedIn against /api/profiles
  // ─────────────────────────────────────────────

  const handleVerify = async () => {
    if (!session?.user?.name) {
      setError("You must login with LinkedIn first.");
      return;
    }

    if (!linkedinUrl.trim()) {
      setError("Please enter your LinkedIn profile URL.");
      return;
    }

    setVerifying(true);
    setVerified(false);
    setVerifiedPerson(null);
    setError("");

    try {
      const res = await fetch("/api/profiles", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || !data.success || !Array.isArray(data.data)) {
        throw new Error("Unable to load Powerlist profiles.");
      }

      // Normalize URLs for comparison
      const normalizeUrl = (url: string) => {
        return url
          .trim()
          .toLowerCase()
          .replace(/^https?:\/\//, "")
          .replace(/^www\./, "")
          .replace(/\/$/, "");
      };

      const normalizedLinkedInUrl = normalizeUrl(linkedinUrl);

      const loggedInName =
        session.user.name.trim().toLowerCase();

      // Find matching Powerlist profile
      const person = data.data.find((profile: any) => {
        if (!profile.title) {
          return false;
        }

        const profileName =
          profile.title.trim().toLowerCase();

        // Name must match LinkedIn login name
        if (profileName !== loggedInName) {
          return false;
        }

        // Find LinkedIn social icon
        const linkedinSocial =
          profile.social_icons?.find(
            (social: any) =>
              social?.icon_type?.toLowerCase() === "linkedin"
          );

        if (!linkedinSocial?.social_network_url) {
          return false;
        }

        const profileLinkedInUrl =
          normalizeUrl(
            linkedinSocial.social_network_url
          );

        return (
          profileLinkedInUrl ===
          normalizedLinkedInUrl
        );
      });

      if (!person) {
        setError(
          "We could not verify your profile. Your LinkedIn name and URL must match an Innovate Finance Powerlist profile."
        );

        return;
      }

      // Successfully verified
      setVerified(true);
      setVerifiedPerson(person);

      setError("");
    } catch (err: any) {
      setError(
        err.message ||
          "Verification failed. Please try again."
      );
    } finally {
      setVerifying(false);
    }
  };

  // ─────────────────────────────────────────────
  // Mint
  // ─────────────────────────────────────────────

  const handleMint = async () => {
    if (!address) return;

    if (!verified) {
      setError(
        "Please verify your LinkedIn profile first."
      );
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/mint", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          wallet: address,
          linkedinUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Mint failed"
        );
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">

        {/* ─────────────────────────────────────── */}
        {/* Header */}
        {/* ─────────────────────────────────────── */}

        <div className="text-center">
          <h1 className="text-3xl font-bold">
            Innovate Finance NFT
          </h1>

          <p className="text-gray-400 mt-2">
            Claim your official profile NFT
          </p>

          <p className="text-xs text-yellow-500 mt-1">
            Currently on Avalanche Fuji Testnet
          </p>
        </div>

        {/* ─────────────────────────────────────── */}
        {/* Step 1 - LinkedIn */}
        {/* ─────────────────────────────────────── */}

        <div className="bg-gray-900 rounded-xl p-6 space-y-4">

          <h2 className="font-semibold text-lg">
            1. Login with LinkedIn
          </h2>

          {status === "loading" ? (

            <p className="text-gray-400">
              Loading...
            </p>

          ) : session ? (

            <div className="space-y-4">

              <p className="text-green-400 text-sm">
                ✓ Logged in
              </p>

              {/* LinkedIn name */}
              <div>
                <label className="text-sm text-gray-400">
                  LinkedIn Name
                </label>

                <div className="mt-1 bg-gray-800 rounded-lg px-3 py-2">
                  {session.user?.name}
                </div>
              </div>

              {/* LinkedIn URL */}
              <div>
                <label className="text-sm text-gray-400">
                  LinkedIn Profile URL
                </label>

                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => {
                    setLinkedinUrl(e.target.value);
                    setVerified(false);
                    setVerifiedPerson(null);
                    setError("");
                  }}
                  placeholder="https://www.linkedin.com/in/yourname/"
                  className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-white outline-none focus:border-blue-500"
                />
              </div>

              {/* Verify */}
              <button
                onClick={handleVerify}
                disabled={
                  verifying ||
                  !linkedinUrl.trim()
                }
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed py-3 rounded-lg font-medium"
              >
                {verifying
                  ? "Verifying..."
                  : "Verify Powerlist Profile"}
              </button>

              {/* Verified */}
              {verified && verifiedPerson && (
                <div className="rounded-lg border border-green-700 bg-green-900/30 p-4">

                  <p className="text-green-400 font-semibold">
                    ✓ Profile Verified
                  </p>

                  <p className="text-sm mt-2">
                    {verifiedPerson.title}
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    {verifiedPerson.artist_title}
                  </p>

                  {verifiedPerson.featured_image && (
                    <img
                      src={verifiedPerson.featured_image}
                      alt={verifiedPerson.title}
                      className="mt-3 w-24 h-24 object-cover rounded-lg"
                    />
                  )}
                </div>
              )}

              {/* Sign out */}
              <button
                onClick={() => {
                  signOut();
                }}
                className="text-sm text-red-400 hover:underline"
              >
                Sign out
              </button>

            </div>

          ) : (

            <button
              onClick={() =>
                signIn("linkedin")
              }
              className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-medium"
            >
              Login with LinkedIn
            </button>

          )}
        </div>

        {/* ─────────────────────────────────────── */}
        {/* Step 2 - Core Wallet */}
        {/* ─────────────────────────────────────── */}

        <div className="bg-gray-900 rounded-xl p-6 space-y-4">

          <h2 className="font-semibold text-lg">
            2. Connect Core Wallet
          </h2>

          <p className="text-sm text-gray-400">
            Supports Gmail / Email login • Fuji Testnet
          </p>

          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              mounted,
            }) => {

              const ready = mounted;

              const connected =
                ready && account && chain;

              return (
                <div>

                  {!connected ? (

                    <button
                      onClick={openConnectModal}
                      className="w-full bg-[#E84142] hover:bg-[#d63839] py-3 rounded-lg font-medium"
                    >
                      Connect Core Wallet
                    </button>

                  ) : chain?.unsupported ? (

                    <button
                      onClick={openChainModal}
                      className="w-full bg-red-600 py-3 rounded-lg"
                    >
                      Wrong Network – Switch to Fuji
                    </button>

                  ) : (

                    <div className="flex gap-3">

                      <button
                        onClick={openChainModal}
                        className="bg-gray-800 px-4 py-2 rounded-lg text-sm"
                      >
                        {chain.name}
                      </button>

                      <button
                        onClick={openAccountModal}
                        className="bg-gray-800 px-4 py-2 rounded-lg text-sm flex-1"
                      >
                        {account.displayName}
                      </button>

                    </div>
                  )}

                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>

        {/* ─────────────────────────────────────── */}
        {/* Step 3 - Mint */}
        {/* ─────────────────────────────────────── */}

        <div className="bg-gray-900 rounded-xl p-6 space-y-4">

          <h2 className="font-semibold text-lg">
            3. Claim Your NFT
          </h2>

          <button
            onClick={handleMint}
            disabled={
              !session ||
              !verified ||
              !isConnected ||
              loading
            }
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed py-3 rounded-lg font-medium"
          >
            {loading
              ? "Minting..."
              : !verified
              ? "Verify LinkedIn First"
              : "Mint My NFT"}
          </button>

          {error && (
            <p className="text-red-400 text-sm">
              {error}
            </p>
          )}

          {result && (
            <div className="mt-4 p-4 bg-green-900/30 border border-green-700 rounded-lg text-sm space-y-2">

              <p className="text-green-400 font-medium">
                Successfully minted!
              </p>

              <p>
                <strong>Name:</strong>{" "}
                {result.name}
              </p>

              <p>
                <strong>Transaction:</strong>{" "}
                <a
                  href={`https://testnet.snowtrace.io/tx/${result.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  View on Snowtrace (Fuji)
                </a>
              </p>

              {result.image && (
                <img
                  src={result.image}
                  alt={result.name}
                  className="mt-3 rounded-lg w-full"
                />
              )}

            </div>
          )}

        </div>

      </div>
    </main>
  );
}
