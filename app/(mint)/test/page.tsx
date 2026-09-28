"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useState } from "react";

export default function MintPage() {
  const { data: session, status } = useSession();
  const { address, isConnected } = useAccount();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    name?: string;
    txHash?: string;
    tokenId?: string;
    image?: string;
  } | null>(null);
  const [error, setError] = useState("");

  const handleMint = async () => {
    if (!address || !session) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/mint3", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: address,
          name: session.user?.name || "Unknown",
          email: session.user?.email || "",
          image: session.user?.image || "",
          linkedinId: session.user?.id || "",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Mint failed");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const canMint = !!session && isConnected && !loading;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-black text-white">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">Innovate Finance NFT</h1>
          <p className="text-gray-400 mt-2">Claim your official profile NFT</p>
          <p className="text-xs text-yellow-500 mt-1">
            Avalanche Fuji Testnet
          </p>
        </div>

        {/* Step 1 – LinkedIn */}
        <div className="bg-gray-900 rounded-xl p-6 space-y-4 border border-gray-800">
          <h2 className="font-semibold text-lg">1. Login with LinkedIn</h2>

          {status === "loading" ? (
            <p className="text-gray-400 text-sm">Loading session...</p>
          ) : session ? (
            <div className="space-y-3">
              <p className="text-green-400 text-sm font-medium">✓ Logged in</p>
              <div className="flex items-center gap-3">
                {session.user?.image && (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "Profile"}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="font-medium">{session.user?.name}</p>
                  <p className="text-xs text-gray-400">{session.user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="text-sm text-red-400 hover:underline"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn("linkedin")}
              className="w-full flex items-center justify-center gap-2 bg-[#0A66C2] hover:bg-[#004182] py-3 rounded-lg font-medium transition"
            >
              Login with LinkedIn
            </button>
          )}
        </div>

        {/* Step 2 – Wallet */}
        <div className="bg-gray-900 rounded-xl p-6 space-y-4 border border-gray-800">
          <h2 className="font-semibold text-lg">2. Connect Core Wallet</h2>
          <p className="text-sm text-gray-400">
            Fuji Testnet • Core / MetaMask supported
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
              const connected = ready && account && chain;

              return (
                <div>
                  {!connected ? (
                    <button
                      onClick={openConnectModal}
                      className="w-full bg-[#E84142] hover:bg-[#d63839] py-3 rounded-lg font-medium transition"
                    >
                      Connect Core Wallet
                    </button>
                  ) : chain?.unsupported ? (
                    <button
                      onClick={openChainModal}
                      className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-lg font-medium transition"
                    >
                      Wrong Network – Switch to Fuji
                    </button>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={openChainModal}
                        className="bg-gray-800 hover:bg-gray-700 px-4 py-2.5 rounded-lg text-sm transition"
                      >
                        {chain.name}
                      </button>
                      <button
                        onClick={openAccountModal}
                        className="bg-gray-800 hover:bg-gray-700 px-4 py-2.5 rounded-lg text-sm flex-1 transition"
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

        {/* Step 3 – Mint */}
        <div className="bg-gray-900 rounded-xl p-6 space-y-4 border border-gray-800">
          <h2 className="font-semibold text-lg">3. Claim Your NFT</h2>

          <button
            onClick={handleMint}
            disabled={!canMint}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed py-3 rounded-lg font-medium transition"
          >
            {loading ? "Minting..." : "Mint My NFT"}
          </button>

          {!session && (
            <p className="text-xs text-gray-500">Login with LinkedIn first</p>
          )}
          {session && !isConnected && (
            <p className="text-xs text-gray-500">Connect your wallet first</p>
          )}

          {error && (
            <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg text-sm text-red-300">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-2 p-4 bg-green-900/20 border border-green-700 rounded-lg text-sm space-y-2">
              <p className="text-green-400 font-medium">Successfully minted!</p>

              {result.name && (
                <p>
                  <span className="text-gray-400">Name:</span> {result.name}
                </p>
              )}

              {result.tokenId && (
                <p>
                  <span className="text-gray-400">Token ID:</span>{" "}
                  {result.tokenId}
                </p>
              )}

              {result.txHash && (
                <p>
                  <span className="text-gray-400">Transaction:</span>{" "}
                  <a
                    href={`https://testnet.snowtrace.io/tx/${result.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-400 hover:text-blue-300"
                  >
                    View on Snowtrace
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