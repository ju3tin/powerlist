"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useState } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleMint = async () => {
    if (!address) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: address }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Mint failed");
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
        <div className="text-center">
          <h1 className="text-3xl font-bold">Innovate Finance NFT</h1>
          <p className="text-gray-400 mt-2">
            Claim your official profile NFT
          </p>
          <p className="text-xs text-yellow-500 mt-1">
            Currently on Avalanche Fuji Testnet
          </p>
        </div>

        {/* Step 1 - LinkedIn */}
        <div className="bg-gray-900 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">1. Login with LinkedIn</h2>
          {status === "loading" ? (
            <p className="text-gray-400">Loading...</p>
          ) : session ? (
            <div className="space-y-2">
              <p className="text-green-400 text-sm">✓ Logged in</p>
              <p className="text-xs text-gray-400 truncate">
                {session.linkedinUrl}
              </p>
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
              className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-medium"
            >
              Login with LinkedIn
            </button>
          )}
        </div>

        {/* Step 2 - Core Wallet */}
        <div className="bg-gray-900 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">2. Connect Core Wallet</h2>
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
              const connected = ready && account && chain;

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

        {/* Step 3 - Mint */}
        <div className="bg-gray-900 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">3. Claim Your NFT</h2>

          <button
            onClick={handleMint}
            disabled={!session || !isConnected || loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed py-3 rounded-lg font-medium"
          >
            {loading ? "Minting..." : "Mint My NFT"}
          </button>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {result && (
            <div className="mt-4 p-4 bg-green-900/30 border border-green-700 rounded-lg text-sm space-y-2">
              <p className="text-green-400 font-medium">Successfully minted!</p>
              <p>
                <strong>Name:</strong> {result.name}
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
