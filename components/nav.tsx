"use client";

import Link from "next/link";


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
          href="/profiles"
          className="font-semibold text-lg"
        >
          Profile Manager
        </Link>

        <Link
          href="/profiles"
          className="text-sm text-blue-600 font-medium"
        >
          Profiles
        </Link>
        <Link
          href="/profiles/new"
          className="text-sm text-gray-600 hover:text-blue-600"
        >
          New Profile
        </Link>

        <Link
          href="/upload"
          className="text-sm text-gray-600 hover:text-blue-600"
        >
          Upload JSON
        </Link>
      </div>
      <Link href='/api/auth/logout' passHref legacyBehavior>
		
      <button
        className="text-sm text-red-600 hover:underline"
      >
        Logout
      </button>
      </Link>
    </nav>
  );
}
