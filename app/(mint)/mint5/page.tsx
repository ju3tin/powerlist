"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useState } from "react";

interface Profile {
  _id?: string;
  id: number;
  title: string;
  artist_title?: string;
  featured_image?: string;
  social_icons?: {
    icon_type?: string;
    social_network_url?: string;
  }[];
}

interface VerifyResponse {
  success: boolean;
  verified?: boolean;
  profile?: Profile;
  linkedinFirstName?: string;
  linkedinLastName?: string;
  linkedinFullName?: string;
  error?: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const { address, isConnected } = useAccount();

  const [linkedinUrl, setLinkedinUrl] = useState("");

  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verifiedPerson, setVerifiedPerson] =
    useState<Profile | null>(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  /*
   * ==========================================
   * VERIFY LINKEDIN / POWERLIST PROFILE
   * ==========================================
   *
   * The first name and last name are NOT sent
   * from the browser.
   *
   * /api/verify reads:
   *
   * linkedin_first_name
   * linkedin_last_name
   *
   * directly from the cookies on the server.
   */
  const handleVerify = async () => {
    console.log("");
    console.log("==========================================");
    console.log("🔍 LINKEDIN VERIFICATION START");
    console.log("==========================================");

    setError("");
    setVerified(false);
    setVerifiedPerson(null);

    if (!session) {
      console.error("❌ No authenticated LinkedIn session");

      setError("Please login with LinkedIn first.");
      return;
    }

    console.log(
      "👤 Authenticated session:",
      session.user?.name
    );

    /*
     * LinkedIn URL is optional for matching now.
     *
     * It can still be supplied and stored/displayed.
     */
    if (linkedinUrl.trim()) {
      console.log(
        "🔗 LinkedIn URL entered:",
        linkedinUrl
      );
    } else {
      console.log(
        "ℹ️ No LinkedIn URL entered"
      );
    }

    setVerifying(true);

    try {
      console.log("📡 Calling /api/verify...");

      const response = await fetch("/api/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          linkedinUrl: linkedinUrl.trim(),
        }),
      });

      console.log(
        "📡 /api/verify status:",
        response.status
      );

      const data: VerifyResponse =
        await response.json();

      console.log(
        "📦 Verification response:",
        data
      );

      if (
        !response.ok ||
        !data.success ||
        !data.verified
      ) {
        console.error(
          "❌ LINKEDIN VERIFICATION FAILED"
        );

        setError(
          data.error ||
            "We could not verify your Innovate Finance Powerlist profile."
        );

        return;
      }

      console.log("");
      console.log(
        "=========================================="
      );
      console.log(
        "✅ LINKEDIN VERIFICATION SUCCESS"
      );
      console.log(
        "=========================================="
      );

      console.log(
        "👤 LinkedIn first name:",
        data.linkedinFirstName
      );

      console.log(
        "👤 LinkedIn last name:",
        data.linkedinLastName
      );

      console.log(
        "👤 LinkedIn full name:",
        data.linkedinFullName
      );

      console.log(
        "🏆 Verified Powerlist profile:",
        data.profile
      );

      setVerified(true);
      setVerifiedPerson(
        data.profile || null
      );
    } catch (err) {
      console.error(
        "💥 Verification request failed:",
        err
      );

      setError(
        "Something went wrong while verifying your profile."
      );
    } finally {
      setVerifying(false);
    }
  };

  /*
   * ==========================================
   * MINT NFT
   * ==========================================
   *
   * /api/mint independently checks:
   *
   * linkedin_first_name cookie
   * linkedin_last_name cookie
   *
   * against the Powerlist profile.
   *
   * We do NOT trust the browser's verified state.
   */
  const handleMint = async () => {
    console.log("");
    console.log("==========================================");
    console.log("🪙 NFT MINT START");
    console.log("==========================================");

    setError("");
    setResult(null);
    setLoading(true);

    if (!session) {
      console.error(
        "❌ Mint blocked: no LinkedIn session"
      );

      setError(
        "Please login with LinkedIn first."
      );

      setLoading(false);
      return;
    }

    if (!verified) {
      console.error(
        "❌ Mint blocked: profile not verified"
      );

      setError(
        "Please verify your LinkedIn profile first."
      );

      setLoading(false);
      return;
    }

    if (!isConnected || !address) {
      console.error(
        "❌ Mint blocked: wallet not connected"
      );

      setError(
        "Please connect your Core Wallet first."
      );

      setLoading(false);
      return;
    }

    console.log(
      "👤 Session user:",
      session.user?.name
    );

    console.log(
      "💳 Wallet:",
      address
    );

    console.log(
      "🏆 Verified profile:",
      verifiedPerson
    );

    try {
      const response = await fetch(
        "/api/mint6",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            wallet: address,
            linkedinUrl:
              linkedinUrl.trim(),
          }),
        }
      );

      console.log(
        "📡 /api/mint status:",
        response.status
      );

      const data = await response.json();

      console.log(
        "📦 Mint response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.error || "Mint failed."
        );
      }

      console.log("");
      console.log(
        "=========================================="
      );
      console.log(
        "✅ NFT MINT SUCCESS"
      );
      console.log(
        "=========================================="
      );

      setResult(data);
    } catch (err: any) {
      console.error(
        "💥 Mint error:",
        err
      );

      setError(
        err?.message ||
          "NFT mint failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">

      <div className="w-full max-w-md space-y-6">

        {/* HEADER */}

        <div className="text-center">

          <h1 className="text-3xl font-bold">
            Innovate Finance NFT
          </h1>

          <p className="text-gray-400 mt-2">
            Claim your official profile NFT
          </p>

          <p className="text-xs text-yellow-500 mt-2">
            Avalanche Fuji Testnet
          </p>

        </div>

        {/* ========================================= */}
        {/* STEP 1 */}
        {/* ========================================= */}

        <div className="bg-gray-900 rounded-xl p-6 space-y-4">

          <h2 className="font-semibold text-lg">
            1. Login & Verify with LinkedIn
          </h2>

          {status === "loading" && (
            <p className="text-gray-400">
              Loading...
            </p>
          )}

          {status !== "loading" &&
            !session && (

              <button
                onClick={() =>
                  signIn("linkedin", {
                    callbackUrl: "/",
                  })
                }
                className="w-full bg-[#0A66C2] hover:bg-[#004182] py-3 rounded-lg font-medium"
              >
                Login with LinkedIn
              </button>

            )}

          {status !== "loading" &&
            session && (

              <div className="space-y-4">

                {/* LOGIN STATUS */}

                <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg">

                  <p className="text-green-400 text-sm font-semibold">
                    ✓ Logged in with LinkedIn
                  </p>

                  {session.user?.name && (
                    <p className="text-white mt-1">
                      {session.user.name}
                    </p>
                  )}

                  {session.user?.email && (
                    <p className="text-xs text-gray-400 mt-1">
                      {session.user.email}
                    </p>
                  )}

                </div>

                {/* VERIFICATION FORM */}

                {!verified && (

                  <div className="space-y-4">

                    <div>

                      <label
                        htmlFor="linkedinUrl"
                        className="block text-sm text-gray-300 mb-2"
                      >
                        LinkedIn Profile URL
                        <span className="text-gray-500 ml-1">
                          (optional)
                        </span>
                      </label>

                      <input
                        id="linkedinUrl"
                        type="url"
                        value={linkedinUrl}
                        onChange={(event) => {
                          setLinkedinUrl(
                            event.target.value
                          );

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
                      disabled={verifying}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed py-3 rounded-lg font-medium"
                    >
                      {verifying
                        ? "Verifying..."
                        : "Verify Powerlist Profile"}
                    </button>

                  </div>

                )}

                {/* VERIFIED PROFILE */}

                {verified &&
                  verifiedPerson && (

                    <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg space-y-4">

                      <p className="text-green-400 font-semibold">
                        ✓ Powerlist Profile Verified
                      </p>

                      {verifiedPerson.featured_image && (
                        <img
                          src={
                            verifiedPerson.featured_image
                          }
                          alt={
                            verifiedPerson.title
                          }
                          className="w-full rounded-lg"
                        />
                      )}

                      <div>

                        <p className="text-lg font-semibold">
                          {
                            verifiedPerson.title
                          }
                        </p>

                        {verifiedPerson.artist_title && (
                          <p className="text-sm text-gray-400 mt-1">
                            {
                              verifiedPerson.artist_title
                            }
                          </p>
                        )}

                      </div>

                      {linkedinUrl && (
                        <div className="text-xs text-gray-400 break-all">
                          <span className="text-gray-500">
                            LinkedIn:
                          </span>{" "}
                          {linkedinUrl}
                        </div>
                      )}

                    </div>

                  )}

                {/* SIGN OUT */}

                <button
                  onClick={() => {
                    setVerified(false);
                    setVerifiedPerson(null);
                    setLinkedinUrl("");
                    setError("");

                    signOut({
                      callbackUrl: "/",
                    });
                  }}
                  className="text-sm text-red-400 hover:underline"
                >
                  Sign out
                </button>

              </div>

            )}

        </div>

        {/* ========================================= */}
        {/* STEP 2 */}
        {/* ========================================= */}

        <div className="bg-gray-900 rounded-xl p-6 space-y-4">

          <h2 className="font-semibold text-lg">
            2. Connect Core Wallet
          </h2>

          <p className="text-sm text-gray-400">
            Supports Gmail / Email login •
            Fuji Testnet
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
                ready &&
                account &&
                chain;

              return (
                <div>

                  {!connected && (

                    <button
                      onClick={
                        openConnectModal
                      }
                      className="w-full bg-[#E84142] hover:bg-[#d63839] py-3 rounded-lg font-medium"
                    >
                      Connect Core Wallet
                    </button>

                  )}

                  {connected &&
                    chain?.unsupported && (

                      <button
                        onClick={
                          openChainModal
                        }
                        className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-lg"
                      >
                        Wrong Network –
                        Switch to Fuji
                      </button>

                    )}

                  {connected &&
                    !chain?.unsupported && (

                      <div className="flex gap-3">

                        <button
                          onClick={
                            openChainModal
                          }
                          className="bg-gray-800 px-4 py-2 rounded-lg text-sm"
                        >
                          {chain.name}
                        </button>

                        <button
                          onClick={
                            openAccountModal
                          }
                          className="bg-gray-800 px-4 py-2 rounded-lg text-sm flex-1"
                        >
                          {
                            account.displayName
                          }
                        </button>

                      </div>

                    )}

                </div>
              );
            }}
          </ConnectButton.Custom>

        </div>

        {/* ========================================= */}
        {/* STEP 3 */}
        {/* ========================================= */}

        <div className="bg-gray-900 rounded-xl p-6 space-y-4">

          <h2 className="font-semibold text-lg">
            3. Claim Your NFT
          </h2>

          {!verified && (
            <p className="text-sm text-yellow-500">
              Verify your LinkedIn Powerlist
              profile before minting.
            </p>
          )}

          {verified && !isConnected && (
            <p className="text-sm text-yellow-500">
              Connect your Core Wallet before
              minting.
            </p>
          )}

          <button
            onClick={handleMint}
            disabled={
              !session ||
              !verified ||
              !isConnected ||
              !address ||
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

            <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg text-sm space-y-3">

              <p className="text-green-400 font-semibold">
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

                  <strong>
                    Transaction:
                  </strong>{" "}

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
                  alt={
                    result.name ||
                    "NFT"
                  }
                  className="mt-3 rounded-lg w-full"
                />

              )}

              {result.url && (

                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-400 underline break-all"
                >
                  View NFT metadata
                </a>

              )}

            </div>

          )}

        </div>

      </div>

    </main>
  );
}