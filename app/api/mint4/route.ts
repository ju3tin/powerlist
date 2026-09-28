"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useState } from "react";

export default function MintPage() {
  const { data: session, status } = useSession();
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleMint = async () => {
    if (!address || !session) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/mint", {
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

      const text = await res.text();
      let data: any = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(text || `Server error (${res.status})`);
      }

      if (!res.ok) {
        throw new Error(data.error || `Mint failed (${res.status})`);
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ... rest of your JSX
}