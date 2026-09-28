"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useState } from "react";

interface SocialIcon {
  icon_type?: string;
  social_network_url?: string;
}

interface Profile {
  _id?: string;
  id: number;
  title: string;
  artist_title?: string;
  featured_image?: string;
  social_icons?: SocialIcon[];
}

export default function Home() {
  const { data: session, status } = useSession();
  const { address, isConnected } = useAccount();

  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verifiedPerson, setVerifiedPerson] = useState<Profile | null>(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  /*
   * Normalise LinkedIn URLs so that these are treated as the same:
   *
   * https://www.linkedin.com/in/abbythomas/
   * https://linkedin.com/in/abbythomas
   * http://www.linkedin.com/in/abbythomas/
   */
  const normalizeLinkedInUrl = (url: string) => {
    return url
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/$/, "");
  };

  /*
   * VERIFY LINKEDIN PROFILE
   */
  const handleVerify = async () => {
    console.log("========================================");
    console.log("🔍 STARTING LINKEDIN VERIFICATION");
    console.log("========================================");

    setError("");
    setVerified(false);
    setVerifiedPerson(null);

    /*
     * Check login
     */
    if (!session?.user?.name) {
      console.error("❌ Verification failed: no LinkedIn session");
      setError("Please login with LinkedIn first.");
      return;
    }

    /*
     * Check LinkedIn URL
     */
    if (!linkedinUrl.trim()) {
      console.error("❌ Verification failed: no LinkedIn URL");
      setError("Please enter your LinkedIn profile URL.");
      return;
    }

    const loggedInName = session.user.name.trim().toLowerCase();
    const normalizedLinkedInUrl = normalizeLinkedInUrl(linkedinUrl);

    console.log("👤 LinkedIn name:", session.user.name);
    console.log("🔗 Entered LinkedIn URL:", linkedinUrl);
    console.log("🔗 Normalized LinkedIn URL:", normalizedLinkedInUrl);

    setVerifying(true);

    try {
      /*
       * Get all Innovate Finance profiles
       */
      console.log("📡 Fetching /api/profiles...");

      const res = await fetch("/api/profiles", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      });

      console.log("📡 /api/profiles response status:", res.status);

      const data = await res.json();

      console.log("📋 Profiles API response:", data);

      if (!res.ok || !data.success || !Array.isArray(data.data)) {
        console.error("❌ Invalid /api/profiles response");

        setError("Unable to load Innovate Finance profiles.");
        return;
      }

      console.log(`📊 Profiles received: ${data.data.length}`);

      /*
       * Find matching profile
       */
      let matchedPerson: Profile | null = null;

      for (const profile of data.data as Profile[]) {
        const profileName = profile.title?.trim().toLowerCase() || "";

        const linkedinIcon = profile.social_icons?.find(
          (social) =>
            social.icon_type?.toLowerCase() === "linkedin" &&
            social.social_network_url
        );

        const profileLinkedInUrl = linkedinIcon?.social_network_url
          ? normalizeLinkedInUrl(linkedinIcon.social_network_url)
          : "";

        console.log("------------------------------------------------");
        console.log("Checking profile:");
        console.log("Name:", profile.title);
        console.log("Normalised name:", profileName);
        console.log("Profile LinkedIn:", profileLinkedInUrl);
        console.log("Name matches:", profileName === loggedInName);
        console.log(
          "LinkedIn matches:",
          profileLinkedInUrl === normalizedLinkedInUrl
        );

        if (
          profileName === loggedInName &&
          profileLinkedInUrl === normalizedLinkedInUrl
        ) {
          matchedPerson = profile;

          console.log("✅ MATCH FOUND!");
          console.log("Verified person:", profile);

          break;
        }
      }

      /*
       * No match
       */
      if (!matchedPerson) {
        console.log("========================================");
        console.log("❌ LINKEDIN VERIFICATION FAILED");
        console.log("========================================");

        setError(
          "We could not find a matching Innovate Finance Powerlist profile. Please make sure your LinkedIn name and profile URL match the Powerlist."
        );

        return;
      }

      /*
       * Successful verification
       */
      console.log("========================================");
      console.log("✅ LINKEDIN VERIFICATION SUCCESS");
      console.log("========================================");
      console.log("Verified profile:", matchedPerson);

      setVerifiedPerson(matchedPerson);
      setVerified(true);
    } catch (err) {
      console.error("💥 Verification error:", err);

      setError("Something went wrong while verifying your profile.");
    } finally {
      setVerifying(false);
    }
  };

  /*
   * MINT NFT
   */
  const handleMint = async () => {
    console.log("========================================");
    console.log("🪙 STARTING NFT MINT");
    console.log("========================================");

    setLoading(true);
    setError("");
    setResult(null);

    if (!session) {
      console.error("❌ Mint failed: not logged in");
      setError("Please login with LinkedIn first.");
      setLoading(false);
      return;
    }

    if (!verified) {
      console.error("❌ Mint failed: profile not verified");
      setError("Please verify your LinkedIn profile first.");
      setLoading(false);
      return;
    }

    if (!address) {
      console.error("❌ Mint failed: wallet not connected");
      setError("Please connect your Core Wallet.");
      setLoading(false);
      return;
    }

    console.log("👤 User:", session.user?.name);
    console.log("📧 Email:", session.user?.email);
    console.log("🔗 LinkedIn:", linkedinUrl);
    console.log("💳 Wallet:", address);
    console.log("👤 Verified profile:", verifiedPerson);

    try {
      const res = await fetch("/api/mint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: address,
          name: verifiedPerson?.title,
          linkedinUrl,
          imageUrl: verifiedPerson?.featured_image,
        }),
      });

      console.log("📡 /api/mint response:", res.status);

      const data = await res.json();

      console.log("📦 Mint response:", data);

      if (!res.ok) {
        throw new Error(data.error || "Mint failed");
      }

      console.log("========================================");
      console.log("✅ NFT MINT SUCCESS");
      console.log("========================================");

      setResult(data);
    } catch (err: any) {
      console.error("💥 Mint error:", err);

      setError(err.message || "Mint failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-black text-white">
      <div className="max-w-md w-full space-y-6">

        {/* HEADER */}
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

        {/* STEP 1 */}
        <div className="bg-gray-900 rounded-xl p-6 space-y-4">

          <h2 className="font-semibold text-lg">
            1. Login & Verify with LinkedIn
          </h2>

          {status === "loading" ? (
            <p className="text-gray-400">
              Loading...
            </p>
          ) : session ? (

            <div className="space-y-4">

              <div className="p-3 bg-green-900/30 border border-green-700 rounded-lg">
                <p className="text-green-400 text-sm font-medium">
                  ✓ Logged in with LinkedIn
                </p>

                <p className="text-sm text-gray-300 mt-1">
                  {session.user?.name}
                </p>

                {session.user?.email && (
                  <p className="text-xs text-gray-500 mt-1">
                    {session.user.email}
                  </p>
                )}
              </div>

              {!verified && (
                <>
                  <div>
                    <label
                      htmlFor="linkedin"
                      className="block text-sm text-gray-300 mb-2"
                    >
                      LinkedIn Profile URL
                    </label>

                    <input
                      id="linkedin"
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => {
                        setLinkedinUrl(e.target.value);
                        setVerified(false);
                        setVerifiedPerson(null);
                        setError("");
                      }}
                      placeholder="https://www.linkedin.com/in/your-name/"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    onClick={handleVerify}
                    disabled={verifying || !linkedinUrl.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed py-3 rounded-lg font-medium"
                  >
                    {verifying
                      ? "Verifying..."
                      : "Verify Powerlist Profile"}
                  </button>
                </>
              )}

              {/* VERIFIED */}
              {verified && verifiedPerson && (
                <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg space-y-3">

                  <p className="text-green-400 font-semibold">
                    ✓ Profile Verified
                  </p>

                  {verifiedPerson.featured_image && (
                    <img
                      src={verifiedPerson.featured_image}
                      alt={verifiedPerson.title}
                      className="w-full rounded-lg"
                    />
                  )}

                  <div>
                    <p className="font-semibold text-lg">
                      {verifiedPerson.title}
                    </p>

                    {verifiedPerson.artist_title && (
                      <p className="text-sm text-gray-400 mt-1">
                        {verifiedPerson.artist_title}
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-gray-400 break-all">
                    LinkedIn: {linkedinUrl}
                  </p>
                </div>
              )}

              <button
                onClick={() => {
                  setVerified(false);
                  setVerifiedPerson(null);
                  setLinkedinUrl("");
                  setError("");
                  signOut();
                }}
                className="text-sm text-red-400 hover:underline"
              >
                Sign out
              </button>

            </div>

          ) : (

            <button
              onClick={() => signIn("linkedin")}
              className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-medium"
            >
              Login with LinkedIn
            </button>

          )}
        </div>

        {/* STEP 2 */}
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
                      className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-lg"
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

        {/* STEP 3 */}
        <div className="bg-gray-900 rounded-xl p-6 space-y-4">

          <h2 className="font-semibold text-lg">
            3. Claim Your NFT
          </h2>

          {!verified && (
            <p className="text-sm text-yellow-500">
              Verify your LinkedIn Powerlist profile before minting.
            </p>
          )}

          {verified && !isConnected && (
            <p className="text-sm text-yellow-500">
              Connect your Core Wallet before minting.
            </p>
          )}

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
              : "Mint My NFT"}
          </button>

          {/* ERROR */}
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg">
              <p className="text-red-400 text-sm">
                {error}
              </p>
            </div>
          )}

          {/* SUCCESS */}
          {result && (
            <div className="mt-4 p-4 bg-green-900/30 border border-green-700 rounded-lg text-sm space-y-3">

              <p className="text-green-400 font-medium">
                Successfully minted!
              </p>

              {result.name && (
                <p>
                  <strong>Name:</strong>{" "}
                  {result.name}
                </p>
              )}

              {result.txHash && (
                <p>
                  <strong>Transaction:</strong>{" "}

                  <a
                    href={`https://testnet.snowtrace.io/tx/${result.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-400"
                  >
                    View on Snowtrace (Fuji)
                  </a>
                </p>
              )}

              {result.image && (
                <img
                  src={result.image}
                  alt={result.name || "NFT"}
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
