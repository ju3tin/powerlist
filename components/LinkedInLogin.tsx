// components/LinkedInLogin.tsx
"use client"

export default function LinkedInLogin() {
  return (
    <a
      href="/api/auth/linkedin"
      className="inline-flex items-center gap-2 rounded bg-[#0A66C2] px-4 py-2 text-white"
    >
      Sign in with LinkedIn
    </a>
  )
}