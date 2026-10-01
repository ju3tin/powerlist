"use client";

import Link from "next/link";
import LogoutButton from "@/app/components/admin/LogoutButton";

export default function AdminNav() {
 
    function handleLogout() {
        document.cookie =
          "admin_token=; path=/; max-age=0";
    
        window.location.href = "/login";
      }

  return (
    <nav className="bg-white border-b px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link
          href="/admin/dashboard"
          className="font-semibold text-lg"
        >
          Profile Manager
        </Link>

        <Link
          href="/admin/profiles"
          className="text-sm text-blue-600 font-medium"
        >
          Profiles
        </Link>
        <Link
          href="/admin/profiles/new"
          className="text-sm text-gray-600 hover:text-blue-600"
        >
          New Profile
        </Link>
        <Link
          href="/admin/editticket"
          className="text-sm text-gray-600 hover:text-blue-600"
        >
          Ticket Editor
        </Link>

        <Link
          href="/admin/upload"
          className="text-sm text-gray-600 hover:text-blue-600"
        >
          Upload JSON
        </Link>
      </div>
    <LogoutButton />
    </nav>
  );
}
