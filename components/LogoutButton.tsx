
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
  onLogout?: () => void;
}

export default function LogoutButton({
  className = "",
  children = "Sign out",
  onLogout,
}: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;

    setLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      // Reset any local UI state managed by the parent.
      onLogout?.();

      // Refresh the page so authentication and profile
      // information are fetched again without the old session.
      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.assign("/api/auth/logout1");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={className}
      aria-label="Sign out of LinkedIn and your Powerlist profile"
    >
      {loading ? "Signing out..." : children}
    </button>
  );
}